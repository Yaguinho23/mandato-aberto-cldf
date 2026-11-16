import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { USER_AGENT, criarBuscar } from "./http";

const ok = () => new Response("ok", { status: 200 });

describe("buscar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T09:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("envia o User-Agent do projeto", async () => {
    const fetchFalso = vi.fn(async () => ok());
    const buscar = criarBuscar(fetchFalso);
    await buscar("https://a.example/x");
    const init = fetchFalso.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("user-agent")).toBe(
      "MandatoAbertoCLDF/1.0 (+https://mandatoaberto.org; contato@mandatoaberto.org)",
    );
    expect(USER_AGENT).toBe("MandatoAbertoCLDF/1.0 (+https://mandatoaberto.org; contato@mandatoaberto.org)");
  });

  it("mantém os cabeçalhos e o corpo passados por quem chama", async () => {
    const fetchFalso = vi.fn(async () => ok());
    const buscar = criarBuscar(fetchFalso);
    await buscar("https://a.example/x", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
    const init = fetchFalso.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe("{}");
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });

  it("tenta 3 vezes em erro 500 e então lança", async () => {
    const fetchFalso = vi.fn(async () => new Response("erro", { status: 500 }));
    const buscar = criarBuscar(fetchFalso);
    const promessa = buscar("https://a.example/x");
    const verificacao = expect(promessa).rejects.toThrow(/500/);
    await vi.runAllTimersAsync();
    await verificacao;
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });

  it("tenta de novo quando a conexão cai e devolve a resposta boa", async () => {
    let n = 0;
    const fetchFalso = vi.fn(async () => {
      n++;
      if (n === 1) throw new TypeError("conexão fechada");
      return ok();
    });
    const buscar = criarBuscar(fetchFalso);
    const promessa = buscar("https://a.example/x");
    await vi.runAllTimersAsync();
    expect((await promessa).status).toBe(200);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  it("lança em status 404 sem insistir", async () => {
    const fetchFalso = vi.fn(async () => new Response("não existe", { status: 404 }));
    const buscar = criarBuscar(fetchFalso);
    const promessa = buscar("https://a.example/x");
    const verificacao = expect(promessa).rejects.toThrow(/404/);
    await vi.runAllTimersAsync();
    await verificacao;
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it("espera pelo menos 1 segundo entre chamadas ao mesmo host", async () => {
    const momentos: number[] = [];
    const fetchFalso = vi.fn(async () => {
      momentos.push(Date.now());
      return ok();
    });
    const buscar = criarBuscar(fetchFalso);
    const p = Promise.all([buscar("https://a.example/1"), buscar("https://a.example/2"), buscar("https://a.example/3")]);
    await vi.runAllTimersAsync();
    await p;
    expect(momentos[1] - momentos[0]).toBeGreaterThanOrEqual(1000);
    expect(momentos[2] - momentos[1]).toBeGreaterThanOrEqual(1000);
  });

  it("não atrasa chamadas a hosts diferentes", async () => {
    const momentos: number[] = [];
    const fetchFalso = vi.fn(async () => {
      momentos.push(Date.now());
      return ok();
    });
    const buscar = criarBuscar(fetchFalso);
    const p = Promise.all([buscar("https://a.example/1"), buscar("https://b.example/1")]);
    await vi.runAllTimersAsync();
    await p;
    expect(momentos[1] - momentos[0]).toBeLessThan(1000);
  });
});

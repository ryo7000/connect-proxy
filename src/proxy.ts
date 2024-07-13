import * as http from "node:http";
import { Message, PartialMessage, ServiceType } from "@bufbuild/protobuf";
import { connectNodeAdapter, createConnectTransport } from "@connectrpc/connect-node";
import { ConnectRouter, createPromiseClient, CallOptions, Transport, HandlerContext } from "@connectrpc/connect";
import { ElizaService } from "./gen/proto/eliza_connect";

type UnaryClient<I extends Message<I>, O extends Message<O>> = (request: PartialMessage<I>, options?: CallOptions) => Promise<O | PartialMessage<O>>;
type ServerStreamClient<I extends Message<I>, O extends Message<O>> = (request: PartialMessage<I>, options?: CallOptions) => AsyncIterable<O>;

type RpcName<T extends ServiceType> = keyof T['methods'];
type UnaryImpl<I extends Message<I>, O extends Message<O>> = (request: I, context: HandlerContext) => Promise<O | PartialMessage<O>>;
type ServerStreamingImpl<I extends Message<I>, O extends Message<O>> = (request: I, context: HandlerContext) => AsyncIterable<O | PartialMessage<O>>;

const transports: Record<string, Transport> = {};

const createUnaryProxy = <
  T extends ServiceType,
  I extends Message<I> & { host: string },
  O extends Message<O>
>(service: T, name: RpcName<T>): UnaryImpl<I, O> => {
  return async (req: I) => {
    const host = req.host;

    if (!(host in transports)) {
      transports[host] = createConnectTransport({
        httpVersion: "1.1",
        baseUrl: `http://${host}`,
      });
    }

    const transport = transports[host];
    const client = createPromiseClient(service, transport);

    console.log("proxy unary req");
    return await (client[name] as UnaryClient<I, O>)(req as PartialMessage<I>);
  };
};

const createStreamProxy = <
  T extends ServiceType,
  I extends Message<I> & { host: string },
  O extends Message<O>
>(service: T, name: RpcName<T>): ServerStreamingImpl<I, O> => {
  return async function* (req: I) {
    const host = req.host;

    if (!(host in transports)) {
      transports[host] = createConnectTransport({
        httpVersion: "1.1",
        baseUrl: `http://${host}`,
      });
    }

    const transport = transports[host];
    const client = createPromiseClient(service, transport);
    const fn = client[name] as ServerStreamClient<I, O>;

    console.log("proxy server stream req");
    for await (const res of fn(req as PartialMessage<I>)) {
      yield res;
    }
  };
};

const routes = (router: ConnectRouter) => {
  return router.service(ElizaService, {
    say: createUnaryProxy(ElizaService, "say"),
    introduce: createStreamProxy(ElizaService, "introduce"),
  });
};

http.createServer(connectNodeAdapter({ routes })).listen(50051);

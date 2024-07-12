import * as http from "node:http";
import { Message, PartialMessage } from "@bufbuild/protobuf";
import { connectNodeAdapter, createConnectTransport } from "@connectrpc/connect-node";
import { ConnectRouter, createPromiseClient, CallOptions } from "@connectrpc/connect";
import { ElizaService } from "./gen/proto/eliza_connect";

type UnaryFn<I extends Message<I>, O extends Message<O>> = (request: PartialMessage<I>, options?: CallOptions) => Promise<O>;
type ServerStreamFn<I extends Message<I>, O extends Message<O>> = (request: PartialMessage<I>, options?: CallOptions) => AsyncIterable<O>;

const createUnaryProxy = <
  I extends Message<I>,
  O extends Message<O>
>(client: UnaryFn<I, O>) => {
  return async (req: PartialMessage<I>) => {
    console.log("proxy unary req");
    return await client(req);
  };
};

const createStreamProxy = <
  I extends Message<I>,
  O extends Message<O>
>(client: ServerStreamFn<I, O>) => {
  return async function* (req: PartialMessage<I>) {
    console.log("proxy server stream req");
    for await (const res of client(req)) {
      yield res;
    }
  };
};

const routes = (router: ConnectRouter) => {
  const transport = createConnectTransport({
    httpVersion: "1.1",
    baseUrl: "http://localhost:50052",
  });
  const client = createPromiseClient(ElizaService, transport);

  return router.service(ElizaService, {
    say: createUnaryProxy(client.say),
    introduce: createStreamProxy(client.introduce),
  });
};

http.createServer(connectNodeAdapter({ routes })).listen(50051);

import * as http from "node:http";
import { connectNodeAdapter, createConnectTransport } from "@connectrpc/connect-node";
import { ConnectRouter, HandlerContext, createPromiseClient } from "@connectrpc/connect";
import { ElizaService } from "./gen/proto/eliza_connect";
import {
  SayRequest,
  IntroduceRequest,
} from "./gen/proto/eliza_pb";

const routes = (router: ConnectRouter) => {
  const transport = createConnectTransport({
    httpVersion: "1.1",
    baseUrl: 'http://localhost:50052',
  });
  const client = createPromiseClient(ElizaService, transport);

  return router.service(ElizaService, {
    async say(req: SayRequest, context: HandlerContext) {
      return await client.say(req);
    },
    async *introduce(req: IntroduceRequest, context: HandlerContext) {
      for await (const res of client.introduce(req)) {
        yield res;
      }
    },
  });
};

http.createServer(connectNodeAdapter({ routes })).listen(50051);

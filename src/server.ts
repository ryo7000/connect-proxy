import * as http from "node:http";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import { ConnectError, ConnectRouter, HandlerContext } from "@connectrpc/connect";
import { ElizaService } from "./gen/proto/eliza_connect";
import {
  SayRequest,
  SayResponse,
  IntroduceRequest,
} from "./gen/proto/eliza_pb";

const sleep = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const port = Number(process.argv[2]);
console.log(`server starts with ${port}`);

const routes = (router: ConnectRouter) =>
  router.service(ElizaService, {
    async say(req: SayRequest, context: HandlerContext) {
      return new SayResponse({
        sentence: `[${Date.now()}][${port}] You said ${req.sentence}`,
      });
    },
    async *introduce(req: IntroduceRequest, context: HandlerContext) {
      try {
        while (!context.signal.aborted) {
          yield { sentence: `[${Date.now()}][${port}] Hi ${req.name}, I'm eliza` };
          await sleep(1000);
        }

        console.log(`request end`);
      } catch (e) {
        const err = ConnectError.from(e);
        console.error(err);
      }
    },
  });

http.createServer(connectNodeAdapter({ routes })).listen(port);

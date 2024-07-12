import { createConnectTransport } from "@connectrpc/connect-node";
import { createPromiseClient } from "@connectrpc/connect";
import { ElizaService } from "./gen/proto/eliza_connect";

(async () => {
  const transport = createConnectTransport({
    httpVersion: "1.1",
    baseUrl: 'http://localhost:50051',
  });
  const client = createPromiseClient(ElizaService, transport);

  for await (const res of client.introduce({name: "foobar"})) {
    console.log(res.toJsonString());
  }
})();

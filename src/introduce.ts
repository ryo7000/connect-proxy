import { createConnectTransport } from "@connectrpc/connect-node";
import { ConnectError, createPromiseClient } from "@connectrpc/connect";
import { ElizaService } from "./gen/proto/eliza_connect";

(async () => {

  const transport = createConnectTransport({
    httpVersion: "1.1",
    baseUrl: 'http://localhost:50051',
  });
  const client = createPromiseClient(ElizaService, transport);

  const port = Number(process.argv[2]);

  let i = 0;

  const abort = new AbortController();
  try {
    for await (const res of client.introduce({host: `localhost:${port}`, name: "foobar"}, { signal: abort.signal })) {
      // if (i > 2) {
      //   console.log('abort');
      //   abort.abort();
      //   return;
      // }

      console.log(res.toJsonString());
      i++;
    }
  } catch (e) {
    const err = ConnectError.from(e);
    console.error(err);
  }
})();

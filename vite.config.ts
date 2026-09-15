import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // @ts-ignore
  base: "/DemoATS/", 
  tanstackStart: {
    server: { entry: "server" },
  },
});

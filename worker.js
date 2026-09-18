/* donthi.dev Worker: www -> apex, everything else is a static asset. */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.donthi.dev") {
      url.hostname = "donthi.dev";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};

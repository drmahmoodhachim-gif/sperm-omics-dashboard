fetch("https://sperm-omics-dashboard.netlify.app/datasets")
  .then((r) => r.text())
  .then(async (t) => {
    const css = t.match(/\/_next\/static\/css\/[a-z0-9]+\.css/g);
    const js = t.match(/\/_next\/static\/chunks\/[a-z0-9]+\/[a-z0-9]+\.js/g)?.slice(0, 2);
    console.log("css:", css?.[0]);
    console.log("js sample:", js);
    for (const path of [css?.[0], ...(js || [])].filter(Boolean)) {
      const r = await fetch("https://sperm-omics-dashboard.netlify.app" + path);
      console.log(path, "->", r.status);
    }
  })
  .catch(console.error);

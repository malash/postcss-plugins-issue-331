const postcss = require('postcss');
const postcssCustomProperties = require('postcss-custom-properties');

const WITH_CUSTOM_PROPERTIES = `
:root {
  --color: red;
}

h1 {
  color: var(--color);
}
`;

const WITHOUT_CUSTOM_PROPERTIES = `
div {
  height: 10px;
}
`;

// this fake async plugin do nothing but await for next tick
const fakeAsyncPlugin = (opts = {}) => {
  // Plugin creator to check options or prepare caches
  return {
    postcssPlugin: 'A fake async plugin',
    Declaration: async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    },
  };
};
fakeAsyncPlugin.postcss = true;

// the `run` function process one task of `WITH_CUSTOM_PROPERTIES` and N tasks of `WITHOUT_CUSTOM_PROPERTIES` in parallel
// N is a number larger or equal to 0
const run = async (n = 0) => {
  const postcssInstance = postcss([
    fakeAsyncPlugin(),
    postcssCustomProperties({
      preserve: false,
    }),
  ]);
  const tasks = [];
  tasks.push(postcssInstance.process(WITH_CUSTOM_PROPERTIES).then(res => res.css));
  // add some other tasks that don't contain any custom property
  for (let i = 0; i < n; i++) {
    tasks.push(postcssInstance.process(WITHOUT_CUSTOM_PROPERTIES).then(res => res.css));
  }
  const results = await Promise.all(tasks);
  // result the result of `WITH_CUSTOM_PROPERTIES`
  return results[0];
};

const main = async () => {
  const result0 = await run(0);
  const result1 = await run(1);
  console.log('Check output CSS same:');
  console.log(result0 === result1); // should be true
  console.log('Process only one task:');
  console.log(result0);
  console.log('Process more than one tasks:');
  console.log(result1);
};

main();

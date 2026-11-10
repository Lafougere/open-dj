const config = {
  stories: ['../out-tsc/stories/**/*.stories.{js,md,mdx}'],

  framework: {
    name: '@storybook/web-components-webpack5',
    options: {}
  },

  docs: {
    autodocs: true
  },

  addons: ['@storybook/addon-webpack5-compiler-swc', '@chromatic-com/storybook']
};

export default config;
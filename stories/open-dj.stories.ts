import { html, TemplateResult } from 'lit';
import '../src/open-dj.js';

export default {
  title: 'OpenDj',
  component: 'open-dj',
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

interface Story<T> {
  (args: T): TemplateResult;
  args?: Partial<T>;
  argTypes?: Record<string, unknown>;
}

interface ArgTypes {
  header?: string;
  backgroundColor?: string;
}

const Template: Story<ArgTypes> = ({ header, backgroundColor = 'white' }: ArgTypes) => html`
  <open-dj style="--open-dj-background-color: ${backgroundColor}" .header=${header}></open-dj>
`;

export const App = Template.bind({});
App.args = {
  header: 'My app',
};

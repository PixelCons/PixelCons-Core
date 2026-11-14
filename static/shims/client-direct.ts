import {render} from 'preact';
export function createRoot(container) {
  return {
    render(children) {
      render(children, container);
    },
    unmount() {
      render(null, container);
    },
  };
}

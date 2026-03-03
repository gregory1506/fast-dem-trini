const emptyModule = {};
export const spawn = () => {
  throw new Error('child_process.spawn is not available in the browser build');
};
export default emptyModule;

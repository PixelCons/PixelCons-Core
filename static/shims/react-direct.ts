import {createElement, Fragment, createContext} from 'preact';
import {useState, useEffect, useLayoutEffect, useRef, useMemo, useContext} from 'preact/hooks';
export {createContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useContext};
export function useSyncExternalStore(subscribe, getSnapshot) {
  const value = getSnapshot();
  const [{instance}, force] = useState({instance: {value, getSnapshot}});
  const changed = () => !Object.is(instance.value, instance.getSnapshot());
  useLayoutEffect(() => {
    instance.value = value;
    instance.getSnapshot = getSnapshot;
    if (changed()) force({instance});
  }, [subscribe, value, getSnapshot]);
  useEffect(() => {
    if (changed()) force({instance});
    return subscribe(() => {
      if (changed()) force({instance});
    });
  }, [subscribe]);
  return value;
}
export default {createElement, Fragment};

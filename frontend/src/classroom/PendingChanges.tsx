import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

type Reporter = (dirty: boolean, owner: symbol) => void;
export const PendingChanges = createContext<Reporter>(() => {});
export function usePendingGroup() {
  const parent = useContext(PendingChanges);
  const owners = useRef(new Set<symbol>());
  const [dirty, setDirty] = useState(false);
  const report = useCallback<Reporter>(
    (value, owner) => {
      if (value) owners.current.add(owner);
      else owners.current.delete(owner);
      setDirty(owners.current.size > 0);
      parent(value, owner);
    },
    [parent],
  );
  return { dirty, report };
}
export function usePendingChanges(dirty: boolean) {
  const report = useContext(PendingChanges);
  const owner = useRef(Symbol('editor'));
  useLayoutEffect(() => {
    report(dirty, owner.current);
    return () => report(false, owner.current);
  }, [dirty, report]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}

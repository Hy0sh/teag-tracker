import { AsyncData, type Future, type Result } from "@swan-io/boxed";
import { type DependencyList, useEffect, useState } from "react";

/** Runs a Future on mount / when deps change, exposing its lifecycle as Boxed AsyncData. */
export const useFuture = <T>(
  makeFuture: () => Future<Result<T, string>>,
  deps: DependencyList,
): AsyncData<Result<T, string>> => {
  const [state, setState] = useState<AsyncData<Result<T, string>>>(() => AsyncData.NotAsked());

  useEffect(() => {
    setState(AsyncData.Loading());
    const future = makeFuture();
    future.onResolve((result) => setState(AsyncData.Done(result)));
    return () => future.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
};

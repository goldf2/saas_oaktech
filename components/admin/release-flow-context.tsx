"use client";

import { createContext, useContext, useEffect } from "react";
export type ReleaseActivity = { dirty: boolean; busy: boolean };
export const ReleaseFlowContext = createContext({
  operationBusy: false,
  setActivity: (_id: string, _state: ReleaseActivity | null): void => {},
  goPreview: (_releaseId?: string): void => {},
  goVersions: (): void => {},
});
export function useReleaseActivity(id: string, dirty: boolean, busy: boolean) {
  const { setActivity } = useContext(ReleaseFlowContext);
  useEffect(() => { setActivity(id, { dirty, busy }); }, [id, dirty, busy, setActivity]);
  useEffect(() => () => setActivity(id, null), [id, setActivity]);
}

import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import {
    getAppSnapshot,
    markFirstMeetingComplete,
    resetAllLocalData,
    saveFriendPreference,
    saveUserProfile,
} from "../services/profile.service";
import { getOrCreateCompanion } from "../services/companion.service";

export const AppContext = createContext(null);

const emptySnapshot = {
    user: null,
    preference: null,
    companion: null,
    firstMeetingCompleted: false,
};

export function AppProvider({ children }) {
    const [snapshot, setSnapshot] = useState(emptySnapshot);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            const data = await getAppSnapshot();
            setSnapshot(data);
            setError(null);
            return data;
        } catch (reason) {
            setError(reason);
            throw reason;
        }
    }, []);

    useEffect(() => {
        let active = true;

        getAppSnapshot()
            .then((data) => {
                if (active) {
                    setSnapshot(data);
                    setError(null);
                }
            })
            .catch((reason) => {
                if (active) setError(reason);
            })
            .finally(() => {
                if (active) setReady(true);
            });

        return () => {
            active = false;
        };
    }, []);

    const saveProfile = useCallback(async (profile) => {
        await saveUserProfile(profile);
        return refresh();
    }, [refresh]);

    const chooseFriend = useCallback(async (preference) => {
        await saveFriendPreference(preference);
        return refresh();
    }, [refresh]);

    const createCompanion = useCallback(async () => {
        const friend = await getOrCreateCompanion();
        await refresh();
        return friend;
    }, [refresh]);

    const completeFirstMeeting = useCallback(async () => {
        await markFirstMeetingComplete();
        return refresh();
    }, [refresh]);

    const resetApp = useCallback(async () => {
        await resetAllLocalData();
        return refresh();
    }, [refresh]);

    const stage = !snapshot.user
        ? "welcome"
        : !snapshot.preference
            ? "choose-friend"
            : !snapshot.companion
                ? "creating-friend"
                : !snapshot.firstMeetingCompleted
                    ? "first-meeting"
                    : "home";

    const value = useMemo(() => ({
        ...snapshot,
        stage,
        ready,
        error,
        refresh,
        saveProfile,
        chooseFriend,
        createCompanion,
        completeFirstMeeting,
        resetApp,
    }), [
        snapshot,
        stage,
        ready,
        error,
        refresh,
        saveProfile,
        chooseFriend,
        createCompanion,
        completeFirstMeeting,
        resetApp,
    ]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

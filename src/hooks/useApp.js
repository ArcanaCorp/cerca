import { useContext } from "react";
import { AppContext } from "../context/AppContext";

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp debe usarse dentro de AppProvider");
    }
    return context;
}

export function useUser() {
    return useApp().user;
}

export function useCompanion() {
    return useApp().companion;
}

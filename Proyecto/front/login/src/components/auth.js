import { auth, googleProvider } from "../config/firebase";
import { signInWithPopup } from "firebase/auth";
import { useState } from "react";

export const Auth = () => {

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <button onClick={signInWithGoogle}>Sign In With Google</button>
        </div>
    );
};
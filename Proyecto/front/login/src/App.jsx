import './App.css';
import { auth, googleProvider } from "./config/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"; 
import React, { useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState(''); // Estado para el mensaje de error

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Limpiar errores previos
  
    if (password.length < 6) {
      setErrorMessage("La clave debe tener al menos 6 caracteres.");
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuario registrado:", userCredential.user); // Confirmación de que se registró
      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      setIsLogin(true);
    } catch (error) {
      console.error("Error en el registro:", error); // Log de error
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("El correo ya ha sido registrado.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("La clave debe tener al menos 6 caracteres.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("El correo ingresado no es válido.");
      } else {
        setErrorMessage("Error en el registro. Inténtalo de nuevo.");
      }
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Limpiar errores previos

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "http://localhost:3037";
    } catch (error) {
      setErrorMessage("Email o contraseña incorrectos."); // Mensaje amigable
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.href = "http://localhost:3037"; // Redirección después del login
    } catch (error) {
      setErrorMessage("Error al iniciar sesión con Google: " + error.message);
    }
  };

  return (
    <div className={`wrapper ${isLogin ? 'login-mode' : 'register-mode'}`}>
      <div className='form-box'>
        {isLogin ? (
          <form onSubmit={handleSubmitLogin}>
            <h1>Iniciar Sesión</h1>

            <div className='input-box'>
              <input 
                type='email' 
                placeholder='Email' 
                required 
                onChange={(e) => setEmail(e.target.value)}
              />
              <i className='bx bxs-user'></i>
            </div>

            <div className='input-box'>
              <input 
                type='password' 
                placeholder='Contraseña' 
                required 
                onChange={(e) => setPassword(e.target.value)}
              />
              <i className='bx bxs-lock-alt'></i>
            </div>

            {/* 🔹 Mensaje de error centrado y justo arriba del botón */}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <button type='submit' className='btn'>Iniciar Sesión</button>

            <div className="separator">
              <hr />
              <span> O </span>
              <hr />
            </div>

            <div className="google-login">
              <button type="button" className="btn google-btn" onClick={signInWithGoogle}>
                Iniciar sesión con Google
              </button>
            </div>

            <div className='sign-up-link'>
              <p>¿Aún no tienes una cuenta? 
                <a href='.' onClick={(e) => { e.preventDefault(); setIsLogin(false); }}> Registrarse</a>
              </p>
            </div>
          </form>
        ) : (
          <form className='register-form' onSubmit={handleSubmitRegister}>
            <h1>Registrarse</h1>

            <div className='input-box'>
              <input type='text' placeholder='Usuario' required />
              <i className='bx bxs-user'></i>
            </div>

            <div className='input-box'>
              <input 
                type='email' 
                placeholder='Email' 
                required
                onChange={(e) => setEmail(e.target.value)} 
              />
              <i className='bx bxs-envelope'></i>
            </div>

            <div className='input-box'>
              <input 
                type='password' 
                placeholder='Contraseña' 
                required
                onChange={(e) => setPassword(e.target.value)} 
              />
              <i className='bx bxs-lock-alt'></i>
            </div>

            <div className='forgot'>
              <label>
                <input type='checkbox' required /> Acepto los términos y condiciones
              </label>
            </div>

            {/* 🔹 Mensaje de error centrado y justo arriba del botón */}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <button type='submit' className='btn'>Registrarse</button>

            <div className='login-link'>
              <p>¿Ya tienes una cuenta?
                <a href='.' onClick={(e) => { e.preventDefault(); setIsLogin(true); }}> Iniciar Sesión</a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
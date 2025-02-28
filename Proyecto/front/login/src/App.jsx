import './App.css'
import { auth, googleProvider } from "./config/firebase";
import { signInWithPopup } from "firebase/auth"; 

function App() {

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.href = "http://localhost:3037"; // Redirección correcta
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  return (
    <div className='wrapper'>
      <form action="">
        <h1>Iniciar Sesión</h1>

        <div className='input-box'>
          <input type='text' placeholder='Usuario' required/>
          <i class='bx bxs-user'></i>
        </div>

        <div className='input-box'>
          <input type='password' placeholder='Contraseña' required/>
          <i class='bx bxs-lock-alt' ></i>
        </div>

        <div className='forgot'>
          <label><input type='checkbox' />Recuerdame</label>
          <a href='.'>Olvidé mi Contraseña</a>
        </div>

        <button type='submit' className='btn'>Iniciar Sesión</button>

        {/* Separador con "O" */}
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
          <p>¿Aún no tienes una cuenta? <a href='.'>Registrarse</a></p>
        </div>

      </form>
    </div>
  );
}

export default App

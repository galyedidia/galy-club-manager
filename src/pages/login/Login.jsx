import './Login.css'
import { useState } from 'react'
import { useLogin } from '../../hooks/useLogin'
import { motion } from 'framer-motion'
import Log from '../../components/LogUtil'

export default function Login() {

  const textVar = {
    hidden:  {scale:0.7,rotateZ:8},
    visible: {scale:1,rotateZ:0,transition:{type:'spring'}}
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const {error, isPending, login, clearError, resetPassword} = useLogin()

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (showForgotPassword) {
      resetPassword(email) 
      alert("Reset Password Email was sent - Please check your email")
      setShowForgotPassword(false)
    } else {
      login(email,password)
    }
  }
  const handleContextSwitch = () => {
    setShowForgotPassword((prev)=>{
      if (prev) { // was in forgot password
        return false
      } else {
        setPassword('')
        clearError()
        return true
      }
    })
  }

  const mapAuthCodeToMessage = (authCode) => {
    Log('Login','authCode',authCode)
    switch (authCode) {
      case "auth/invalid-password":
        return "Password provided is not corrected";
  
      case "auth/invalid-email":
        return "Email provided is invalid";

      default:
        return "Unable to Login with this Email and Password";
    }
  }
  const errorMsg = error ? mapAuthCodeToMessage(error.code) : null

  return (
    <div className='auth-form'>
      <h2>Managing your sport Club</h2>
      <h4>In this site you can</h4>
      <p>- Run a Session</p>
      <p>- Track attendence and send payment messages</p>
      <p>- Collect statistics</p>
    <form className='auth-form login' onSubmit={handleFormSubmit}>
      <motion.h2 variants={textVar} initial='hidden' animate='visible'>{showForgotPassword?'Reset Password':'Log-In'}</motion.h2>
      <motion.label variants={textVar} initial='hidden' animate='visible'>
        <span>E-Mail</span>
        <input 
          type="email"
          value={email}
          onChange={(e)=>{
            clearError() 
            setEmail(e.target.value)
          }}
          required
        />
      </motion.label>
      {<motion.label style={showForgotPassword?{opacity:0}:{opacity:1}} variants={textVar} initial='hidden' animate='visible'>
        <span>Pass-Word</span>
        <input 
          type="password"
          value={password}
          onChange={(e)=>{
            clearError()
            setPassword(e.target.value)
          }}
          required={showForgotPassword? false: true}
        />
      </motion.label>}
      <motion.div className='auth-form-btns' variants={textVar} initial='hidden' animate='visible'>
        {!isPending && <button className='btn'>{showForgotPassword?'Reset Password':'Log-In'}</button>}
        {isPending  && <button className='btn' disabled>Logging In...</button>}
        <motion.p
          className='forgot-password' 
          onClick={handleContextSwitch}>{showForgotPassword?'Back to Log-In':'Forgot Passoword?'}
        </motion.p>
      </motion.div>
      <div style={!showForgotPassword && error?{opacity:1}:{opacity:0}} className='error'>{error ? errorMsg: ' '}</div>
    </form>
    <p>Contact</p>
    <a href='mailto:yedidia.gal@gmail.com'>yedidia.gal@gmail.com</a>
    </div>
  )
}

import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'; 
import { useAuthContext } from './hooks/useAuthContext';

// Pages
import ClubManager from './pages/clubManager/ClubManager'
import Login from './pages/login/Login'
import Session from './pages/session/Session'

// Components
import Navbar from './components/Navbar';

function App() {

  // Get Auth Is Ready - Until True - show nothing
  const { authIsReady, user } = useAuthContext()
  const isManager = !!user && user.isManager
  return (
    <>
      {authIsReady &&
        <BrowserRouter>
          <div className='app-container'>
            {user && <Navbar />}
            <Switch>
            <Route exact path="/">
              {!user && <Redirect to="/login" />}
              {user  && <Session/>}
            </Route>
            <Route path="/club-manager">
              {!user && <Redirect to="/login" />}
              {user  && !isManager && <Session/>}
              {user  && isManager  && <ClubManager/>}
            </Route>
            <Route path="/login">
              {user  && <Redirect to="/" />}
              {!user && <Login/>}
            </Route>
            </Switch>
          </div>
        </BrowserRouter>
      }
    </>
  );
}

export default App

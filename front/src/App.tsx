import { NavLink } from "react-router-dom";

function App() {
  return (
    <>
      <div>
        <h1 className="">Todo App</h1>
        <br />
        Please go to <NavLink to="/dashboard" className="bg-blue-200">Dashboard</NavLink>
      </div>
    </>
  )
}

export default App;

import React, { useState, useEffect, useRef } from "react";
import Web3 from "web3";
import { TODO_LIST_ABI, TODO_LIST_ADDRESS } from "./config";

import "./App.css";

function App() {
  const [web3, setWeb3] = useState();
  const [account, setAccount] = useState("not logged");
  const [logged, setLogged] = useState(false);
  const [balance, setBalance] = useState("");
  const [todoList, setTodoList] = useState();
  const [taskCount, setTaskCount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [taskContent, setTaskContent] = useState("");

  useEffect(() => {
    const web3 = new Web3(Web3.givenProvider || "localhost:7545");
    setWeb3(web3);

    const todoList = new web3.eth.Contract(TODO_LIST_ABI, TODO_LIST_ADDRESS);
    setTodoList(todoList);
  }, []);

  useEffect(() => {
    async function load() {
      const taskCount = await todoList?.methods.taskCount().call();
      setTaskCount(taskCount);

      for (var i = 1; i <= taskCount; i++) {
        const task = await todoList?.methods.tasks(i).call();
        setTasks((tasks) => [...tasks, task]);
      }
    }

    load();
  }, [todoList]);

  async function login() {
    await web3.eth.getAccounts().then(async (accounts) => {
      const balance = await web3.eth.getBalance(accounts[0]);
      setAccount(accounts[0]);
      setBalance(balance);
    });

    account && setLogged(true);
  }

  async function logout() {
    setAccount("not logged");
    setLogged(false);
  }

  const formHandler = async (content) => {
    await todoList?.methods.createTask(content).send({ from: account });

    let nextId = tasks.length;
    setTasks((tasks) => [
      ...tasks,
      { id: nextId, content: content, completed: false },
    ]);
    setTaskContent("");
  };

  return (
    <>
      <nav className="navbar navbar-light bg-light">
        <div className="container-fluid">
          <h1>Ocean Protocol Demo</h1>
          <form className="d-flex">
            {logged ? (
              <>
                <p className="mx-2">
                  Account:{" "}
                  {account.substring(0, 4) +
                    "..." +
                    account.substring(account.length - 4, account.length)}
                </p>
                <p className="mx-2">
                  Balance:{" "}
                  {balance.substring(0, 1) +
                    "." +
                    balance.substring(2, 4) +
                    " ETH"}
                </p>
                <button
                  className="btn btn-warning"
                  type="button"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <button className="btn btn-success" type="button" onClick={login}>
                Login
              </button>
            )}
          </form>
        </div>
      </nav>
      <div className="container mt-2">
        <div className="row">
          <div id="content" className="col">
            <ul id="taskList" className="list-unstyled">
              {tasks.map((task, key) => {
                return (
                  <li key={key}>
                    <input
                      type="checkbox"
                      name={task.id}
                      defaultChecked={task.completed}
                      onClick={(e) => {
                        todoList?.methods
                          .toggleCompleted(task.id)
                          .send({ from: account });
                      }}
                    />
                    <span className="content">{task.content}</span>
                  </li>
                );
              })}
            </ul>
            <ul id="completedTaskList" className="list-unstyled"></ul>
          </div>
          {logged && (
            <div className="d-flex col-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  formHandler(taskContent);
                }}
              >
                <input
                  id="newTask"
                  name="content"
                  value={taskContent}
                  type="text"
                  className="form-control"
                  placeholder="Add task..."
                  onChange={(e) => setTaskContent(e.target.value)}
                  required
                />
                <input
                  className="btn btn-outline-primary my-2"
                  type="submit"
                  hidden=""
                />
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;

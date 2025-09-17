import Nav from './Nav.tsx'
import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { apiPath } from './model.ts';
import type { TTask } from './model.ts';
import Modal from "./components/Modal";
import TaskEdit from "./components/TaskEdit";
import DeleteData from "./components/DeleteData";

function Task() {
  const [tasks, setTasks] = useState<TTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // for delete
  const del = useRef(0);

  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // close modal
  const cm = () => {
    setIsOpen(false);
  };

  const closeEdit = () => {
    loadTask();
    cm();
  }

  const handleDelete = (id: number) => {
    del.current = id;
    setModalContent(<DeleteData onClose={closeDelete} />);
    setModalTitle("Delete"); 
    setIsOpen(true);
  }

  const closeDelete = async (confirm: number) => {
    if (confirm == 1) {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No access token");

        const res = await fetch(`${apiPath}/task/delete/${del.current}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

      } catch (err: any) {
        setError(err.message || "Failed to load user");
      } finally {
        loadTask();
      }
    }
    cm();
  }

  const handleAdd = async () => {
    const emptyTask: TTask = {
      uuid: 0,
      todo: "",
      user_id: 0,
      start_date: new Date(),
      end_date: new Date(),
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No access token");

      const res = await fetch(`${apiPath}/users`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const users: any = await res.json();

      setModalContent(<TaskEdit data={emptyTask} users={users} onClose={closeEdit} type="add" />);
      setModalTitle("Add"); 
    } catch (err: any) {
      setError(err.message || "Failed to load task");
    } finally {
      setIsOpen(true);
    }
  }

  const handleEdit = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No access token");

      const res = await fetch(`${apiPath}/task/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: any = await res.json();

      setModalContent(<TaskEdit data={data.task} users={data.users} onClose={closeEdit} type="edit" />);
      setModalTitle("Edit"); 
    } catch (err: any) {
      setError(err.message || "Failed to load task");
    } finally {
      setIsOpen(true);
    }
  }

  const loadTask = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No access token");

      const res = await fetch(`${apiPath}/tasks`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TTask[] = await res.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load task");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTask(); // call it on mount
  }, []); 

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;

  return(
    <>
      <div>
        <Modal
          op={isOpen}
          closeModal={cm}
          title={modalTitle}
          el={modalContent}
        />
      </div>
      <Nav />
      <div className="p-4">
        <p>To add new task please click <button className="bg-blue-500 text-white px-3 mr-3 cursor-pointer" onClick={handleAdd}>Add</button></p>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">No</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">Todo</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
          {tasks?.map((task: TTask,idx: number) => (
            <tr key={task.uuid} className="x p-2 mb-2 rounded">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">{idx+1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">{task.todo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">
                <button className="bg-yellow-500 text-white px-3 mr-3 cursor-pointer" onClick={() => handleEdit(task.uuid)}>Edit</button>
                <button className="bg-red-500 text-white px-3 cursor-pointer" onClick={() => handleDelete(task.uuid)}>Delete</button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Task;

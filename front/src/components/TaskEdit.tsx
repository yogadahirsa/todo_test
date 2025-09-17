import { useState, useEffect } from 'react';
import { apiPath } from '../model.ts';
import type { TUser, TTask } from '../model.ts';

type TaskProps = {
  data: TTask,
  users: TUser[],
  type: string,
  onClose: () => void;
};

function TaskEdit({data, users, type, onClose}: TaskProps) {
  const [uuid, setUuid] = useState(data.uuid);
  const [todo, setTodo] = useState(data.todo);
  const [start_date, setStart_date] = useState<string>('');
  const [end_date, setEnd_date] = useState<string>('');
  const [user_id, setUser_id] = useState(data.user_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No access token");

      let url;
      if (type == 'add') {
        url = `${apiPath}/task/add`;
      }
      else {
        url = `${apiPath}/task/edit`;
      }
      let myBody = JSON.stringify({ 
        uuid, 
        todo, 
        user_id: user_id, 
        start_date: new Date(start_date).toISOString(),
        end_date: new Date(end_date).toISOString(),
      });
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        method: 'POST',
        body: myBody
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onClose();
    } catch (err: any) {
      console.error(err.message || "Failed to update position");
    }
  };

  useEffect(() => {
    setUuid(data.uuid);
    setTodo(data.todo);
    if (data.start_date) {
      const defaultDateStart = new Date(data.start_date).toISOString().split("T")[0];
      setStart_date(defaultDateStart);
    }
    if (data.end_date) {
      const defaultDateEnd = new Date(data.end_date).toISOString().split("T")[0];
      setEnd_date(defaultDateEnd);
    }
    setUser_id(data.user_id);
  }, [data]);

  if (!data || !users) return <p>Loading...</p>;
  return (
    <>
      <form className="min-w-80 flex flex-col gap-3 m-3" onSubmit={handleSubmit}>
        <div className="flex">
          <label className="w-1/2">Task:</label>
          <input 
            className="w-1/2 border border-gray-400 rounded" 
            type="text"
            name="name"
            value={todo}
            required
            onChange={e => setTodo(e.target.value)}
          />
        </div>
        <div className="flex">
          <label className="w-1/2">User:</label>
          <select 
            className="w-1/2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={user_id}
            onChange={e => setUser_id(parseInt(e.target.value))}
          >
            {users?.map((user)=>(
              <option key={user.uuid} value={user.uuid}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex">
          <label className="w-1/2">Start:</label>
          <input 
            className="w-1/2 border border-gray-400 rounded" 
            type="date"
            name="start_date"
            value={start_date || ''}
            onChange={e => setStart_date(e.target.value)}
          />
        </div>
        <div className="flex">
          <label className="w-1/2">Task:</label>
          <input 
            className="w-1/2 border border-gray-400 rounded" 
            type="date"
            name="end_date"
            value={end_date || ''}
            onChange={e => setEnd_date(e.target.value)}
          />
        </div>
        <button
          className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2 mt-4 rounded"
        >Submit</button>
      </form>
    </>
  )
}

export default TaskEdit;

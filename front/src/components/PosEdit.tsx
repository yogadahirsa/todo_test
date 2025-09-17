import { useState, useEffect } from 'react';
import { apiPath } from '../model.ts';

type Position = {
  uuid: number;
  name: string;
};

type UserEditProps = {
  data: Position;
  onClose: () => void;
  type: string;
};

function PosEdit({data, onClose, type}: UserEditProps) {
  const [uuid, setUuid] = useState(data.uuid);
  const [name, setName] = useState(data.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No access token");

      let url;
      if (type == 'add') {
        url = `${apiPath}/position/add`;
      }
      else {
        url = `${apiPath}/position/edit`;
      }
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        method: 'POST',
        body: JSON.stringify({ uuid, name }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onClose();
    } catch (err: any) {
      console.error(err.message || "Failed to update position");
    }
  };

  useEffect(() => {
    setUuid(data.uuid);
    setName(data.name);
  }, [data]);

  if (!data) return <p>Loading...</p>;
  return (
    <>
      <form className="min-w-80 flex flex-col gap-3 m-3" onSubmit={handleSubmit}>
        <div className="flex">
          <label className="w-1/2">Name:</label>
          <input 
            className="w-1/2 border border-gray-400 rounded" 
            type="text"
            name="name"
            value={name}
            required
            onChange={e => setName(e.target.value)}
          />
        </div>
        <button
          className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2 mt-4 rounded"
        >Submit</button>
      </form>
    </>
  )
}

export default PosEdit;

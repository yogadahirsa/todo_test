import Nav from './Nav.tsx'
import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { apiPath } from './model.ts';
import type { TUser, TPosition } from './model.ts';
import Modal from "./components/Modal";
import PosEdit from "./components/PosEdit";
import DeleteData from "./components/DeleteData";

function Position() {
  const [positions, setPositions] = useState<TPosition[]>([]);
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
    loadPosition();
    cm();
  }

  const closeDelete = async (confirm: number) => {
    if (confirm == 1) {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No access token");

        const res = await fetch(`${apiPath}/position/delete/${del.current}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

      } catch (err: any) {
        setError(err.message || "Failed to load user");
      } finally {
        loadPosition();
      }
    }
    cm();
  }

  const handleAdd = () => {
    const emptyPos: TPosition = {
      uuid: 0,
      name: "",
    };
    setModalContent(<PosEdit data={emptyPos} onClose={closeEdit} type="add" />);
    setModalTitle("Add"); 
    setIsOpen(true);
  }

  const handleEdit = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No access token");

      const res = await fetch(`${apiPath}/position/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: TPosition = await res.json();
      setModalContent(<PosEdit data={data} onClose={closeEdit} type="edit" />);
      setModalTitle("Edit"); 
    } catch (err: any) {
      setError(err.message || "Failed to load position");
    } finally {
      setIsOpen(true);
    }
  }

  const handleDelete = (id: number) => {
    del.current = id;
    setModalContent(<DeleteData onClose={closeDelete} />);
    setModalTitle("Delete"); 
    setIsOpen(true);
  }

  const loadPosition = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No access token");

      const res = await fetch(`${apiPath}/positions`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TUser[] = await res.json();
      setPositions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load position");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosition(); // call it on mount
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
        <p>To add new position please click <button className="bg-blue-500 text-white px-3 mr-3 cursor-pointer" onClick={handleAdd}>Add</button></p>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">No</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">Name</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
          {positions?.map((position: TPosition,idx: number) => (
            <tr key={position.uuid} className="x p-2 mb-2 rounded">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">{idx+1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">{position.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">
                <button className="bg-yellow-500 text-white px-3 mr-3 cursor-pointer" onClick={() => handleEdit(position.uuid)}>Edit</button>
                <button className="bg-red-500 text-white px-3 cursor-pointer" onClick={() => handleDelete(position.uuid)}>Delete</button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Position;

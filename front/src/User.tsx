import Nav from "./Nav";
import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { apiPath } from './model.ts';
import type { TUser } from './model.ts';
import Modal from "./components/Modal";
import UserEdit from "./components/UserEdit";
import DeleteData from "./components/DeleteData";

export default function User() {
  const [users, setUsers] = useState<TUser[]>([]);
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
    loadUser();
    cm();
  }

  const closeDelete = async (confirm: number) => {
    if (confirm == 1) {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No access token");

        const res = await fetch(`${apiPath}/user/delete/${del.current}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

      } catch (err: any) {
        setError(err.message || "Failed to load user");
      } finally {
        loadUser();
      }
    }
    cm();
  }

  const handleEdit = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No access token");

      const res = await fetch(`${apiPath}/user/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: TUser = await res.json();
      setModalContent(<UserEdit data={data} onClose={closeEdit} type="edit" />);
      setModalTitle("Edit"); 
    } catch (err: any) {
      setError(err.message || "Failed to load user");
    } finally {
      setIsOpen(true);
    }
  }

  const handleAdd = () => {
    const emptyUser: TUser = {
      uuid: 0,
      name: "",
      username: "",
      password: "",
    };
    setModalContent(<UserEdit data={emptyUser} onClose={closeEdit} type="add" />);
    setModalTitle("Add"); 
    setIsOpen(true);
  }

  const handleDelete = (id: number) => {
    del.current = id;
    setModalContent(<DeleteData onClose={closeDelete} />);
    setModalTitle("Delete"); 
    setIsOpen(true);
  }

  async function loadUser() {
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
      const data: TUser[] = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser(); // call it on mount
  }, []); 

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;

  return (
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
        <p>To add new user please click <button className="bg-blue-500 text-white px-3 mr-3 cursor-pointer" onClick={handleAdd}>Add</button></p>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">No</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">Name</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">Username</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
          {users?.map((user, idx:number) => (
            <tr key={user.uuid} className="x p-2 mb-2 rounded">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">{idx+1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">{user.username}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-neutral-200">
                <button className="bg-yellow-500 text-white px-3 mr-3 cursor-pointer" onClick={() => handleEdit(user.uuid)}>Edit</button>
                <button className="bg-red-500 text-white px-3 cursor-pointer" onClick={() => handleDelete(user.uuid)}>Delete</button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

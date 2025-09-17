type deleteProps = {
  onClose: (cek: number) => void,
}

function DeleteData({onClose}: deleteProps) {
  return(
    <>
      <div className="flex justify-center">
        <p>Are you sure to delete this data?</p>
      </div>
      <div className="flex gap-4 justify-center">
        <button
          className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-4 py-2 mt-4 rounded"
          onClick={() => onClose(1)}
        >Yes</button>
        <button
          className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-4 py-2 mt-4 rounded"
          onClick={() => onClose(0)}
        >No</button>
      </div>
    </>
  )
}

export default DeleteData;

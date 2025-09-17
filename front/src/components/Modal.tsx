type myType = {
  op: boolean;
  closeModal: () => void;
  title: string;
  el: any;
};

function Modal({ op, closeModal, title, el }: myType) {
  return (
    <>
      <div className="w3-container">
        <div
          id="id01"
          className={`custom-box w3-modal ${op ? "block" : "hidden"} `}
        >
          <div className="w3-modal-content">
            <div className="w3-container">
              <div className="flex flex-row justify-between p-2">
                <div className="text-3xl">{title}</div>
                <button onClick={closeModal} className="text-5xl">
                  &times;
                </button>
              </div>
              <hr />
              <div>{el}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Modal;

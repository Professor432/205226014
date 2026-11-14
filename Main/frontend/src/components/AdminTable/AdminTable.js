import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { table as tableAxios } from '../AxiosCreate';
import './AdminTab.css';
import Table from './Table';
import Modal from 'react-bootstrap/Modal';
import ButtonComponent from '../Button/ButtonComponent';
import Loader from '../Loader/Loader';
export default function AdminTab() {
  const [loading, setLoading] = useState(true);
  const [dinnTable, setDinnTable] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [tableid, setTableid] = useState(0);
  const [capacity, setCapacity] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessages, setErrorModalMessages] = useState([]);

  useEffect(() => {
    setLoading(true);
    tableAxios
      .get(`/`)
      .then((response) => {
        setDinnTable(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log('ERROR MESSAGE ::', error);
        toast.error('Unable to load tables.');
        setLoading(false);
      });
  }, [refreshKey]);

  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal(!modal);
  };

  const toggleErrorModal = (messages) => {
    setErrorModalMessages(messages);
    setShowErrorModal(!showErrorModal);
  };

  const validateInput = () => {
    const errors = [];

    if (tableid <= 0 || tableid >= 50) {
      errors.push('Table ID must be between 1 and 49');
    }

    if (capacity <= 0 || capacity >= 20) {
      errors.push('Capacity must be between 1 and 19');
    }

    return errors;
  };

  const addTable = async (e) => {
    e.preventDefault();
    setLoading(true);

    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      setLoading(false);
      console.log('UNAUTHORIZED!!');
      return;
    }

    const validationErrors = validateInput();

    if (validationErrors.length > 0) {
      setLoading(false);
      toggleErrorModal(validationErrors);
      return;
    }

    const data = {
      table_id: tableid,
      capacity: capacity,
      availability_status: availabilityStatus,
    };

    await tableAxios
      .post(`/`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setRefreshKey((key) => key + 1);
        setTableid(0);
        setCapacity(0);
        setAvailabilityStatus('');
        setModal(!modal);
        setLoading(false);
        if (response.status === 201) {
          toast.success('Table created successfully');
        }
      })
      .catch((error) => {
        console.log('ERROR MESSAGE ::', error);
        setLoading(false);
        toast.error('Table already exists.');
      });
  };

  const filteredTables = dinnTable.filter((table) =>
    `${table.table_id} ${table.capacity} ${table.availability_status}`
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );

  return (
    
    <div className="adm-ad">
      {loading ? (
      <Loader />
    ) : (<>
      <div className="addi-ad">
        <div className="w-ad">
          <h2 className="ti-ad">Tables:</h2>
          <input
            type="search"
            className="table-search"
            placeholder="Search tables"
            aria-label="Search dining tables"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <ButtonComponent color={"button4"} message={"Add Table"} func={toggleModal} />
        </div>
      </div> 
      {modal && (
        <div className="overlay-ad" onClick={toggleModal}>
          <div className="content-ad" onClick={(event) => event.stopPropagation()}>
            <form className="mrow-ad" onSubmit={addTable}>
              <div className="row-ad">
                <label htmlFor="title">Table No. :</label>
                <input
                  type="number"
                  className={`in-ad`}
                  name="table_id"
                  required
                  value={tableid}
                  onChange={(e) => setTableid(e.target.value)}
                />
              </div>
              <div className="row-ad">
                <label htmlFor="title">Capacity :</label>
                <input
                  type="number"
                  className={`in-ad`}
                  name="capacity"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
              <div className="row-ad">
                <label htmlFor="title">Availability Status :</label>
                <select
                  className="in-ad"
                  name="avail_stat"
                  required
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                >
                  <option value="">Select availability status</option>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                </select>
              </div>
              <div className="bu-fo-ad">
                <ButtonComponent type="submit" color={"primary"} message={"ADD"} />
                <ButtonComponent color={"secondary"} message={"CLOSE"} func={toggleModal} />
              </div>
            </form>
          </div>
        </div>
      )}
      <section className="item-list-ad">
        {filteredTables.map((table) => (
          <Table key={table.table_id} data={table} onChange={() => setRefreshKey((key) => key + 1)} />
        ))}
        {filteredTables.length === 0 && (
          <p className="table-empty">
            {dinnTable.length === 0 ? 'No dining tables available.' : 'No tables match your search.'}
          </p>
        )}
      </section>

      {/* Custom Error Bullet Point List */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
        <Modal.Header closeButton={false} style={{ backgroundColor: '#942D2D', color: '#EBF2D5' }}>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: '#942D2D', backgroundColor: '#EBF2D5' }}>
          {errorModalMessages.map((message, index) => (
            <p key={index}>&#8226; {message}</p>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <ButtonComponent color={"secondary"} message={"CLOSE"} func={() => setShowErrorModal(false)} />
        </Modal.Footer>
      </Modal>
      </>)}
    </div>
  );
}

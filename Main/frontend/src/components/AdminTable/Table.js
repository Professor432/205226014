import React, { useEffect, useState } from 'react';
import { table as tableAxios } from '../AxiosCreate';
import './Tab.css';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-bootstrap/Modal';
import ButtonComponent from '../Button/ButtonComponent';
export default function AdminTable(props) {

    // console.log(props.data)
    const [tableid, setTableid] = useState(props.data.table_id);
    const [capacity, setCapacity] = useState(props.data.capacity);
    const [availabilityStatus, setAvailabilityStatus] = useState(props.data.availability_status);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessages, setErrorModalMessages] = useState([]);
    const [modal, setModal] = useState(false);

    useEffect(() => {
        setTableid(props.data.table_id);
        setCapacity(props.data.capacity);
        setAvailabilityStatus(props.data.availability_status);
    }, [props.data]);

    const toggleModal = () => {
        setModal(!modal)
    }
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

    const editTable = async (e) => {
        e.preventDefault();

        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            toast.error("Authorization error.");
            return;
        }
        const validationErrors = validateInput();

        if (validationErrors.length > 0) {
            toggleErrorModal(validationErrors);
            return;
        }
        const data = {
            table_id: tableid,
            capacity: capacity,
            availability_status: availabilityStatus
        }
        await tableAxios.put(`/${props.data.table_id}`, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
            .then((response) => {
                setModal(false);
                props.onChange();
                if (response.status === 200) {
                    toast.success("Edited Successfully");
                }
            })
            .catch((error) => {
                console.log("ERROR MESSAGE ::", error)
                toast.error(error.response?.data?.message || "Unable to update table.")
            });
    }

    const deleteTable = async () => {
        if (!window.confirm(`Delete dining table ${props.data.table_id}?`)) {
            return;
        }

        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            toast.error("Authorization error.");
            return;
        }

        await tableAxios.delete(`/${props.data.table_id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
            .then((response) => {
                props.onChange();
                if (response.status === 200) {
                    toast.success("Table removed successfully");
                }
            })
            .catch((error) => {
                console.log("ERROR MESSAGE ::", error)
                toast.error("Database error.")
            });
    }

    return (
        <div className='card-tab my-2'>
            {props.data.availability_status === "Available" ? (<div className='g-tab'></div>) : (<div className='r-tab'></div>)}
            <div className='wrp-tab-2 py-2'>
                <div className='wrp-tab'>
                    <h3 className='te-tab'>T{props.data.table_id}</h3>
                    <p className='cat-tab'>Capacity : {props.data.capacity}</p>
                    <p className='cat-tab'>Availability Status : {props.data.availability_status}</p>
                </div>
                <div className="admin-table-actions">
                    <ButtonComponent color={"button5"} message={"Edit"} func={toggleModal} />
                    <ButtonComponent color={"button5"} message={"Delete"} func={deleteTable} />
                </div>
            </div>
            {modal && (
                <div className='overlay-tab' onClick={toggleModal}>
                    <div className='content-tab' onClick={(event) => event.stopPropagation()} >
                        <form className='mrow-tab' onSubmit={editTable}>
                            <div className="row-tab">
                                <label htmlFor="title" >Table No. :</label>
                                <input type="number" className="in-tab" name="table_id" required value={tableid} onChange={(e) => setTableid(e.target.value)} />
                            </div>
                            <div className="row-tab">
                                <label htmlFor="title" >Capacity :</label>
                                <input type="number" className="in-tab" name="capacity" required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                            </div>
                            <div className="row-tab">
                                <label htmlFor="title" >Availability Status:</label>
                                <select className="in-tab" name="avail_stat" required value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value)}>
                                    <option value="Available">Available</option>
                                    <option value="Occupied">Occupied</option>
                                </select>
                            </div>
                            <div className='bu-fo-tab'>
                                <ButtonComponent type="submit" color={"primary"} message={"Edit"} />
                                <ButtonComponent color={"secondary"} message={"Close"} func={toggleModal} />
                            </div>
                        </form>
                    </div>
                </div>)}
            <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
                <Modal.Header closeButton={false} style={{ backgroundColor: '#942D2D', color: '#EBF2D5' }}>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ color: '#942D2D', backgroundColor: '#EBF2D5' }}>
                    {errorModalMessages.map((message, index) => (
                        <p key={index}>&#8226; {message}</p>
                    ))}
                </Modal.Body>
                <Modal.Footer >
                    <ButtonComponent color={"secondary"} message={"CLOSE"} func={() => setShowErrorModal(false)} />
                </Modal.Footer>
            </Modal>
        </div>
    )
}
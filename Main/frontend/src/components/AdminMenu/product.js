import React, { useState, useEffect } from 'react';
import './Items.css';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-bootstrap/Modal';
import ButtonComponent from "../Button/ButtonComponent";
import { restaurantMenu as menuAxios, category as categoryAxios } from '../AxiosCreate';
export default function Product(props) {

    // console.log(props.data)
    const [categories, setCategories] = useState([]);
    const [menu_name, setMenuName] = useState(props.data.menu_name);
    const [category, setCategory] = useState(props.data.categoryName);
    const [description, setDescription] = useState(props.data.description);
    const [price, setPrice] = useState(props.data.price);
    const [profit, setProfit] = useState(props.data.profit);
    const [img, setImg] = useState(props.data.img);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessages, setErrorModalMessages] = useState([]);
    const toggleErrorModal = (messages) => {
        setErrorModalMessages(messages);
        setShowErrorModal(!showErrorModal);
    };
    const validateInput = () => {
        const errors = [];

        if (price <= 0) {
            errors.push('Price must greater or equal to zero');
        }

        if (profit < 0 || profit > price) {
            errors.push('Profit must be between 0 and Price');
        }

        return errors;
    };
    const [modal, setModal] = useState(false);
    const toggleModal = () => {
        setMenuName(props.data.menu_name);
        setCategory(props.data.categoryName);
        setDescription(props.data.description);
        setPrice(props.data.price);
        setProfit(props.data.profit);
        setImg(props.data.img);
        setModal(!modal)
    }
    useEffect(() => {
        categoryAxios
            .get('/')
            .then((response) => {
                setCategories(response.data.data);
            })
            .catch((error) => {
                console.log('ERROR MESSAGE ::', error);
                toast.error('Unable to load categories.');
            });
    }, []);

    const editProduct = async (e) => {
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
            menu_name: menu_name,
            categoryName: category,
            description: description,
            price: price,
            profit: profit,
            img: img
        }
        await menuAxios.put(`/${props.data.menu_id}`, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
            .then((response) => {
                setModal(false);
                props.onChange();
                if (response.status === 200) {
                    toast.success("MenuItem edited successfully ");
                }
            })
            .catch((error) => {
                console.log("ERROR MESSAGE ::", error)
                toast.error("Menu item name already exists");
            });
    }

    const deleteProduct = async () => {
        if (!window.confirm(`Delete menu item "${props.data.menu_name}"?`)) {
            return;
        }

        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            toast.error("Authorization error.");
            return;
        }

        await menuAxios.delete(`/${props.data.menu_id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
            .then((response) => {
                props.onChange();
                if (response.status === 200) {
                    toast.success("MenuItem deleted successfully ");
                }
            })
            .catch((error) => {
                console.log("ERROR MESSAGE ::", error)
                toast.error("Database error, Can't delete.");
            });
    }

    return (
        <div className='card-i'>
            <img className='im-i'
                src={props.data.img}
                alt={props.data.menu_name} />
            <div className='wrp-i'>
                <h3 className='te-i'>{props.data.menu_name}</h3>
                <p className='cat-i'>{props.data.categoryName}</p>
            </div>
            <p className='cat2-i-1'><span className='te-i-1'>Price :</span> {props.data.price}$</p>
            <p className='cat2-i-1'><span className='te-i-1'>Profit :</span> {props.data.profit}$</p>
            <div className='admin-menu-button'>
                <ButtonComponent color={"button5"} message={"Edit"} func={toggleModal} />
                <ButtonComponent color={"button5"} message={"Delete"} func={deleteProduct} />
            </div>
            {modal && (
                <div className='overlay-i' onClick={toggleModal}>
                    <div className='content-i' onClick={(event) => event.stopPropagation()} >
                        <form className='mrow-i' onSubmit={editProduct}>
                            <div className="row-i">
                                <label htmlFor="title" >Item Name:</label>
                                <input type="text" className="in-i" name="menu_name" required value={menu_name} onChange={(e) => setMenuName(e.target.value)} />
                            </div>
                            <div className="row-i">
                                <label htmlFor="title">Category Name:</label>
                                {/* Use a dropdown for category selection */}
                                <select className="in-a" name="categoryName" required value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.category_id} value={cat.categoryName}>
                                            {cat.categoryName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="row-i">
                                <label htmlFor="author">Short Description :</label>
                                <input type="text" className="in-i" name="description" required value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <div className="row-i">
                                <label htmlFor="img">Image URL :</label>
                                <input type="text" className="in-i" name="img" required value={img} onChange={(e) => setImg(e.target.value)} />
                            </div>
                            <div className="row-i">
                                <label htmlFor="content" >Price :</label>
                                <input type="number" className="in-i" name="price" required value={price} onChange={(e) => setPrice(e.target.value)} />
                            </div>
                            <div className="row-i">
                                <label htmlFor="content" >Profit :</label>
                                <input type="number" className="in-i" name="profit" required value={profit} onChange={(e) => setProfit(e.target.value)} />
                            </div>
                            <div className='bu-fo-i'>
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
                <Modal.Footer style={{ backgroundColor: '#EBF2D5' }}>
                    <ButtonComponent color={"secondary"} message={"CLOSE"} func={() => setShowErrorModal(false)} />
                </Modal.Footer>
            </Modal>
        </div>
    )
}
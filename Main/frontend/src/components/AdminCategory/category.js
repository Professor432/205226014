import React, { useState } from 'react';
import { category as categoryAxios } from '../AxiosCreate';
import './Cat.css';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import ButtonComponent from '../Button/ButtonComponent';

export default function Category(props) {

    // console.log(props.data)
    const [categoryName, setCategoryName] = useState(props.data.categoryName);

    const [modal, setModal] = useState(false);
    const toggleModal = () => {
        setModal(!modal)
    }
    const editCategory = async (e) => {
        e.preventDefault();

        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            console.log("UNAUTHORIZED!!");
            toast.error("Authorization error.");
            return;
        }

        const data = {
            categoryName: categoryName
        }
        await categoryAxios.put(`/${props.data.category_id}`, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
            .then((response) => {
                setModal(false);
                props.onChange();
                if (response.status === 200)
                    toast.success("Category name edited succesfully.");
            })
            .catch((error) => {
                console.log("ERROR MESSAGE ::", error);
                toast.error("Category already exists");
            });
    }

    const deleteCategory = async () => {
        if (!window.confirm(`Delete category "${props.data.categoryName}"? Its menu items will also be deleted.`)) {
            return;
        }

        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            console.log("UNAUTHORIZED!!");
            toast.error("Authorization error.");
            return;
        }

        await categoryAxios.delete(`/${props.data.category_id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
            .then((response) => {
                props.onChange();
                if (response.status === 200)
                    toast.success("Category deleted succesfully.");
            })
            .catch((error) => {
                console.log("ERROR MESSAGE ::", error)
                toast.error("Category is not deleted due to database error.");
            });
    }

    return (
        <div className='card-t p-3 my-2' >
            <div className='wrp-2-t'>
                <div className='wrp-t'>
                    <h3 className='te-t'>{props.data.categoryName}</h3>
                    <p className='cat-t'>Item count: {props.data.item_count}</p>
                </div>
                <div className='admin-category-button'>
                    <ButtonComponent color={"button5"} message={"Edit"} func={toggleModal} />
                    <ButtonComponent color={"button5"} message={"Delete"} func={deleteCategory} />
                </div>
            </div>
            {modal && (
                <div className='overlay-t' onClick={toggleModal}>
                    <div className='content-t' onClick={(event) => event.stopPropagation()} >
                        <form className='mrow-t' onSubmit={editCategory}>
                            <div className="row-t">
                                <label htmlFor="title" >Category Name: </label>
                                <input type="text" required className='in-t' name="categoryName" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
                            </div>
                            <div className='bu-fo-t'>
                                <ButtonComponent type="submit" color={"primary"} message={"Edit"} />
                                <ButtonComponent color={"secondary"} message={"Close"} func={toggleModal} />
                            </div>
                        </form>
                    </div>
                </div>)}
        </div>
    )
}
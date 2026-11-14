import React, { useState, useEffect } from 'react';
import { restaurantMenu as menuAxios, category as categoryAxios } from '../AxiosCreate';
import './AdminMenu.css';
import Product from './product';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-bootstrap/Modal';
import ButtonComponent from '../Button/ButtonComponent';
import Pagination from '../PaginationBar/PaginationBar';
import Loader from '../Loader/Loader';

export default function AdminMenu() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [menuItemsCnt, setMenuItemsCnt] = useState(0);
  const [menuName, setMenuName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState();
  const [profit, setProfit] = useState();
  const [img, setImg] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessages, setErrorModalMessages] = useState([]);
  const [currPage, setCurrentPage] = useState(1);
  const limit = 6;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleErrorModal = (messages) => {
    setErrorModalMessages(messages);
    setShowErrorModal(!showErrorModal);
  };
  const validateInput = () => {
    const errors = [];

    if (price <= 0 || profit < 0) {
      errors.push('Price must greater or equal to zero');
    }

    if (profit < 0 || profit > price) {
      errors.push('Profit must be between 0 and Price');
    }

    return errors;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const params = new URLSearchParams({
        page: currPage,
        limit,
        searchTerm: searchTerm.trim(),
      });
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      await menuAxios.get(`?${params.toString()}`)
        .then((response) => {
          setProducts(response.data.data)
          setMenuItemsCnt(response.data.totalCount);
          setLoading(false);
        })
        .catch((error) => {
          console.log("ERROR MESSAGE ::", error)
          setLoading(false);
        });
    }
    fetchData();
  }, [currPage, limit, searchTerm, selectedCategory, refreshKey]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await categoryAxios.get('/')
        .then((response) => {
          setCategories(response.data.data);
          setLoading(false);
        })
        .catch((error) => {
          console.log('ERROR MESSAGE ::', error);
          setLoading(false);
        });
    }
    fetchData();
  }, []);

  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal((open) => !open);
  }

  const addItem = async (e) => {
    e.preventDefault();
    setLoading(true)

    const accessToken = localStorage.getItem("accessToken");
    // console.log(accessToken)
    if (!accessToken) {
      setLoading(false);
      // alert('An error happened. Please Check console');
      // enqueueSnackbar('UNAUTHORIZED !!', { variant: 'error' });
      console.log("UNAUTHORIZED!!");
      return;
    }
    const validationErrors = validateInput();

    if (validationErrors.length > 0) {
      setLoading(false);
      toggleErrorModal(validationErrors);
      return;
    }
    const data = {
      menu_name: menuName,
      categoryName: category,
      description: description,
      price: price,
      profit: profit,
      img: img
    }
    await menuAxios.post('/', data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })
      .then((response) => {
        setRefreshKey((key) => key + 1);
        setMenuName("");
        setCategory("");
        setDescription("");
        setPrice('');
        setProfit('');
        setImg("");
        setModal(false);
        setLoading(false);
        if (response.status === 201) {
          toast.success("MenuItem created successfully ");
        }

      })
      .catch((error) => {
        console.log("ERROR MESSAGE ::", error)
        setLoading(false);
        toast.error("MenuItem can't be created.");
      });
  }

  const handleSetCurrentPage = (curr) => {
    setCurrentPage(curr)
  }

  return (
    <div className='adm'>
      {loading ? (
        <Loader/>
      ) : (
      // {/* <AdminCategory setCategory={setCategories} /> Pass setCategories as a prop */}
      <>
      <div className="addi-a">
        <h2>Menu Items:</h2>
        <ButtonComponent color={"button4"} message={"Add Item"} func={toggleModal} />
      </div>
      <div className="admin-menu-filters">
        <input
          type="search"
          placeholder="Search menu items"
          aria-label="Search menu items"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          aria-label="Filter menu items by category"
          value={selectedCategory}
          onChange={(event) => {
            setSelectedCategory(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.categoryName}>{cat.categoryName}</option>
          ))}
        </select>
      </div>
      {modal && (
        <div className='overlay-a' onClick={toggleModal}>
          <div className='content-a' onClick={(event) => event.stopPropagation()} >
            <form className='mrow-a' onSubmit={addItem}>
              <div className="row-a">
                <label htmlFor="title" >Item Name:</label>
                <input type="text" className="in-a" name="menu_name" required value={menuName} onChange={(e) => setMenuName(e.target.value)} />
              </div>
              <div className="row-a">
                <label htmlFor="text">Category Name:</label>
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
              <div className="row-a">
                <label htmlFor="author">Short Description: </label>
                <input type="text" className="in-a" name="description" required value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="row-a">
                <label htmlFor="img">Image URL: </label>
                <input type="text" className="in-ad" name="img" required value={img} onChange={(e) => setImg(e.target.value)} />
              </div>
              <div className="row-a">
                <label htmlFor="content">Price: </label>
                <input type="number" className="in-a" name="price" required value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="row-a">
                <label htmlFor="content" >Profit: </label>
                <input type="number" className="in-a" name="profit" required value={profit} onChange={(e) => setProfit(e.target.value)} />
              </div>
              <div className='bu-fo-a'>
                <ButtonComponent type="submit" color={"primary"} message={"ADD"} />
                <ButtonComponent color={"secondary"} message={"CLOSE"} func={toggleModal} />
              </div>
            </form>
          </div>
        </div>)}
      <section className="item-list">
        {
          products.map((product) => (
            <Product key={product.menu_id} data={product} onChange={() => setRefreshKey((key) => key + 1)} />
          ))
        }
        {products.length === 0 && <p className="admin-menu-empty">No menu items match your search.</p>}
        {(menuItemsCnt <= limit) ? (<></>) : (
          <Pagination
            currPage={currPage}
            limit={limit}
            handleSetCurrentPage={handleSetCurrentPage}
            totalItemCount={menuItemsCnt}
          />)}
      </section>
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
      </>)}
    </div>
  )
}
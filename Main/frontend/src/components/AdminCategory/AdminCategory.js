import React, { useState, useEffect } from 'react';
import { category as categoryAxios } from '../AxiosCreate';
import './AdminCat.css';
import Category from './category';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ButtonComponent from '../Button/ButtonComponent';
import Loader from '../Loader/Loader'; // Import your Loader component

export default function AdminCategory() {
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    categoryAxios
      .get('/')
      .then((response) => {
        setCategory(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log('ERROR MESSAGE ::', error);
        toast.error('Unable to load categories.');
        setLoading(false);
      });
  }, [refreshKey]);

  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal(!modal);
  };

  const addCategory = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      console.log('UNAUTHORIZED!!');
      toast.error('Authorization error.');
      return;
    }

    const data = {
      categoryName: categoryName,
    };

    await categoryAxios
      .post('/', data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setRefreshKey((key) => key + 1);
        setCategoryName('');
        setModal(false);
        if (response.status === 201) {
          toast.success('Category created successfully.');
        }
      })
      .catch((error) => {
        console.log('ERROR MESSAGE ::', error);
        toast.error('Category already exists.');
      });
  };

  return (
    <div className='adm-cat'>
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className='addi-cat'>
            <div className='w-cat'>
              <h2 className='ti-cat'>Categories:</h2>
              <input
                type='search'
                className='category-search'
                placeholder='Search categories'
                aria-label='Search categories'
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <ButtonComponent color={'button4'} message={'Add Category'} func={toggleModal} />
            </div>
          </div>
          {modal && (
            <div className='overlay-cat' onClick={toggleModal}>
              <div className='content-ct' onClick={(event) => event.stopPropagation()}>
                <form className='mrow-cat' onSubmit={addCategory}>
                  <div className='row-cat'>
                    <label htmlFor='title'>Category Name:</label>
                    <input type='text' className='in-ca' name='category' required value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
                  </div>
                  <div className='bu-fo-cat'>
                    <ButtonComponent type="submit" color={'primary'} message={'ADD'} />
                    <ButtonComponent color={'secondary'} message={'CLOSE'} func={toggleModal} />
                  </div>
                </form>
              </div>
            </div>
          )}
          <section className='item-list-cat'>
            {category
              .filter((item) => item.categoryName.toLowerCase().includes(searchTerm.trim().toLowerCase()))
              .map((item) => (
                <Category
                  key={item.category_id}
                  data={item}
                  onChange={() => setRefreshKey((key) => key + 1)}
                />
              ))}
            {category.length > 0 && !category.some((item) => item.categoryName.toLowerCase().includes(searchTerm.trim().toLowerCase())) && (
              <p className='category-empty'>No categories match your search.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

import React, { useState, useContext, useEffect } from 'react';
import { getFirestore, doc, getDoc, deleteDoc,query, where, collection, getDocs} from "firebase/firestore"
import { AuthContext } from "../firebase/Auth";
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { doSignOut } from "../firebase/FirebaseFunctions";

const OOTD = () => {
    const currentUser = useContext(AuthContext);
    const navigate = useNavigate();
    const [outfits, setOutfits] = useState([]);
    const [myClothes, setMyClothes] = useState([]);
    const [selectedClothes, setSelectedClothes] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
      const fetchMyClothes = async () => {
          if (!currentUser) {
              console.log("No user found");
              return;
          }
          const db = getFirestore();
          const docRef = doc(db, "closets", currentUser.uid);
  
          const docSnap = await getDoc(docRef);// getDoc() returns a single document
          if (docSnap.exists()) {
              setMyClothes(docSnap.data().items || []);
          } else {
              console.log("No such document in user's closet!");
          }
      };
  
      fetchMyClothes();
  }, [currentUser]); // currentUser is expected to be an object with a currentUser property

  useEffect(() => {
    const fetchOOTDs = async () => {
      if (!currentUser || !currentUser.uid) {
        console.log("No user found");
        return;
      }
      const db = getFirestore();
      // 获取特定用户的OOTD子集合引用
      const userOOTDOutfitsRef = collection(db, "OOTD", currentUser.uid, "outfits");
      
      try {
        // 获取该子集合中的所有文档
        const querySnapshot = await getDocs(userOOTDOutfitsRef);
  
        const fetchedOOTDs = [];
        querySnapshot.forEach((doc) => {
          // 保存文档ID和URL
          fetchedOOTDs.push({ id: doc.id, url: doc.data().outfit_url }); 
        });
        setOutfits(fetchedOOTDs);
      } catch (error) {
        console.error("Error fetching outfits:", error);
      }
    };
  
    fetchOOTDs();
  }, [currentUser]);
  

  const handleSaveOutfit = async () => {
    if (selectedClothes.length === 0 || selectedClothes.length > 6) {
        alert('Please select up to 6 clothing items.');
        return;
    }

    const outfitData = {
        urls: selectedClothes.map(clothe => clothe.url),
        categories: selectedClothes.map(clothe => clothe.category),
        user_id: currentUser.uid,
    };
    
    try {

        //Deployment URL
        //const response = await axios.post('http://20.81.191.105:5000/outfit', outfitData, {
        //Localhost URL
        const response = await axios.post('http://127.0.0.1:5000/outfit', outfitData, {
            headers: { 'Content-Type': 'application/json' },
        });
        const newOutfit = {
            id: response.data.document_id, // Use the document_id from the response
            url: response.data.outfit_url, // Use the outfit_url from the response
          };
        setOutfits(prevOutfits => [...prevOutfits, newOutfit]);
        setModalOpen(false);
    } catch (error) {
        console.error('Error saving outfit: ', error);
        alert('There was an error saving the outfit.');
    }    
};


    // 选择或取消选择衣服时的处理函数
    const handleClotheSelection = (clothe) => {
        const isSelected = selectedClothes.includes(clothe);
        setSelectedClothes(isSelected
            ? selectedClothes.filter(selected => selected !== clothe)
            : [...selectedClothes, clothe]);
    };


    // 删除搭配
    // const deleteOutfit = (outfitUrl) => {
    //     setOutfits(outfits.filter(outfit => outfit !== outfitUrl));
    // };

    const deleteOutfit = async (outfitId) => {
        console.log("Deleting outfit with ID:", outfitId); // Debug log
        if (!outfitId) {
            console.error("Invalid outfitId:", outfitId);
            return;
        }
        const db = getFirestore();
        const docRef = doc(db, "OOTD", currentUser.uid, "outfits", outfitId);
      
        if(window.confirm("Are you sure you want to delete this outfit?")) {
          try {
            await deleteDoc(docRef);
            setOutfits(outfits.filter(outfit => outfit.id !== outfitId));
          } catch (error) {
            console.error("Error deleting outfit:", error);
          }
        }
      };

    const handleSignOut = () => {
      doSignOut();
      navigate("/");
      alert("You have been signed out");
    };

    const openModalAndResetSelection = () => {
        setSelectedClothes([]); // 这将清空之前的选择
        setModalOpen(true); // 然后打开模态框
    };

    // 模态框样式
    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '66%',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        overflow: 'scroll',
        height: '75%',
    };

    return (
        <>
            <Box className="header" 
                sx={{ 
                    backgroundColor: '#ffe8e8',
                    display: 'flex',
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 20px'
                }}>
                {/* 添加点击事件，点击 logo 时跳转到主页 */}
                <img src='WWLogo.jpg' alt="Logo" style={{ width: '50px', cursor: 'pointer' }} onClick={() => navigate('/')} />
            {/* Dropdown menu */}
            {currentUser && (
            <select
                onChange={(e) => {
                    if (e.target.value === "OOTD") {
                        navigate("/OOTD");
                    }else if(e.target.value === "myCloset") {
                        navigate("/myCloset");
                    } else if (e.target.value === "Calendar") {
                        navigate("/calendar");
                    }else if (e.target.value === "home") {
                        navigate("/");
                    } else if (e.target.value === "signOut") {
                        handleSignOut(); 
                    }
                }}
                style={{ position: 'absolute', top: 35, right: 55 }}
            >
                <option value="OOTD">OOTD</option>
                <option value="myCloset">My Closet</option>
                <option value="Calendar">Calendar</option>
                <option value="home">Home</option>
                <option value="signOut">Sign Out</option>
            </select>
            )}
            </Box>
        
        <Box sx={{ flexGrow: 1, paddingLeft: '20px' }}>
            {/* Outfits grid */}
            <Grid container spacing={2} sx={{ mt: 2, '& .MuiGrid-item': { margin: '6px' } }}>
            {outfits.map((outfit, index) => (
            <Grid item key={outfit.id} sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <Card sx={{ width: 320, height: 400, position: 'relative'}}> 
                <button
                onClick={() => deleteOutfit(outfit.id)}
                className="delete-button"
                style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                zIndex: 2,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#000",
                fontWeight: "bold",
                transition: "color 0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#FF0000")}
                onMouseLeave={(e) => (e.target.style.color = "#000")}
            >
                X
            </button>
            <CardMedia
                component="img"
                image={outfit.url}
                alt={`Outfit ${index}`}
                sx={{ 
                    width: '300px', 
                    height: '380px', 
                    maxWidth: '100%',
                    objectFit: 'cover', 
                    objectPosition: 'center' 
                }}
            />
            </Card>
        </Grid>
        ))}

                {/* Add new outfit card */}
                <Grid item xs={4}>
                    <Card sx={{ width: '300px', height: '360px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' }}  onClick={openModalAndResetSelection} >
                        <Box sx={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '5em', color: 'lightgray' }}>+</div>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
            {/* Modal for adding new outfit */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalStyle}>
                    <Grid container spacing={2}>
                        {myClothes.map((clothe, index) => (
                            <Grid item xs={4} sm={3} key={index}>
                                <Card sx={{ maxWidth: '280px', height: '330px', position:'relative'}}>
                                    <CardMedia
                                        component="img"
                                        // height="360"
                                        image={clothe.url}
                                        alt={clothe.name}
                                        sx={{ 
                                            // width: '240px', 
                                            // height: '300px', 
                                            marginLeft: '10px',
                                            marginTop: '10px',
                                            // maxWidth: '100%',
                                            //objectPosition: 'center' 
                                            objectFit: "contain", // 使图片等比例缩放
                                            maxHeight: "240px", // 确保图片高度不超过Card高度
                                            maxWidth: "320px", // 确保图片宽度不超过Card宽度
                                        }}
                                    />
                                <div style={{ position: 'absolute', bottom: '5px', left: '5px' }}>
                                    <FormControlLabel
                                        control={
                                        <Checkbox
                                            checked={selectedClothes.includes(clothe)}
                                            onChange={() => handleClotheSelection(clothe)}
                                            disabled={selectedClothes.length >= 6 && !selectedClothes.includes(clothe)}
                                        />
                                        }
                                        label=""
                                    />
                                    </div>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {/* 组件用于创建一个支持Flexbox布局的容器，并通过display: 'flex'和justifyContent: 'flex-end'将其中的内容（即保存按钮）对齐到容器的右边。同时，通过marginTop和marginBottom属性控制按钮的垂直位置和间距。 */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', marginBottom: '10px' }}>
                    <Button onClick={handleSaveOutfit} sx={{ background: 'purple', color: 'white', ':hover': {backgroundColor: 'purple', color: 'white', opacity: 0.75 } }}>
                        Save as outfit
                    </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
        </>
    );
};
export default OOTD;

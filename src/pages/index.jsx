import Layout from "./Layout.jsx";

import Home from "./Home";

import Product from "./Product";

import ContractForm from "./ContractForm";

import Contract from "./Contract";

import AddProduct from "./AddProduct";

import MyContracts from "./MyContracts";

import CreateContract from "./CreateContract";

import RentalRequest from "./RentalRequest";

import RentalRequests from "./RentalRequests";

import ContactUs from "./ContactUs";

import Chat from "./Chat";

import AboutUs from "./AboutUs";

import MyChats from "./MyChats";

import PaymentInstructions from "./PaymentInstructions";

import ConfirmPayment from "./ConfirmPayment";

import AdminDashboard from "./AdminDashboard";

import MyRentals from "./MyRentals";

import CompleteProfile from "./CompleteProfile";

import PaymentSelection from "./PaymentSelection";

import Payments from "./Payments";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Product: Product,
    
    ContractForm: ContractForm,
    
    Contract: Contract,
    
    AddProduct: AddProduct,
    
    MyContracts: MyContracts,
    
    CreateContract: CreateContract,
    
    RentalRequest: RentalRequest,
    
    RentalRequests: RentalRequests,
    
    ContactUs: ContactUs,
    
    Chat: Chat,
    
    AboutUs: AboutUs,
    
    MyChats: MyChats,
    
    PaymentInstructions: PaymentInstructions,
    
    ConfirmPayment: ConfirmPayment,
    
    AdminDashboard: AdminDashboard,
    
    MyRentals: MyRentals,
    
    CompleteProfile: CompleteProfile,
    
    PaymentSelection: PaymentSelection,
    
    Payments: Payments,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Product" element={<Product />} />
                
                <Route path="/ContractForm" element={<ContractForm />} />
                
                <Route path="/Contract" element={<Contract />} />
                
                <Route path="/AddProduct" element={<AddProduct />} />
                
                <Route path="/MyContracts" element={<MyContracts />} />
                
                <Route path="/CreateContract" element={<CreateContract />} />
                
                <Route path="/RentalRequest" element={<RentalRequest />} />
                
                <Route path="/RentalRequests" element={<RentalRequests />} />
                
                <Route path="/ContactUs" element={<ContactUs />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/AboutUs" element={<AboutUs />} />
                
                <Route path="/MyChats" element={<MyChats />} />
                
                <Route path="/PaymentInstructions" element={<PaymentInstructions />} />
                
                <Route path="/ConfirmPayment" element={<ConfirmPayment />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/MyRentals" element={<MyRentals />} />
                
                <Route path="/CompleteProfile" element={<CompleteProfile />} />
                
                <Route path="/PaymentSelection" element={<PaymentSelection />} />
                
                <Route path="/Payments" element={<Payments />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
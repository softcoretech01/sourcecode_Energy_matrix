import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionManager } from "./components/SessionManager";

import WindmillList from "./pages/windmill_transaction/WindmillList";
import WindmillAdd from "./pages/windmill_transaction/WindmillAdd";
import WindmillEdit from "./pages/windmill_transaction/WindmillEdit";

import EBBillList from "./pages/windmill/eb_bill/EBBillList";
import EBBillAdd from "./pages/windmill/eb_bill/EBBillAdd";
import EBBillEdit from "./pages/windmill/eb_bill/EBBillEdit";

import ActualsList from "./pages/windmill/actuals/ActualsList";
import ActualsAdd from "./pages/windmill/actuals/ActualsAdd";
import ActualsEdit from "./pages/windmill/actuals/ActualsEdit";
import ActualsPdf from "./pages/windmill/actuals/ActualsPdf";

import ClientInvoiceList from "./pages/windmill/client_invoice/ClientInvoiceList";
import ClientInvoiceAdd from "./pages/windmill/client_invoice/ClientInvoiceAdd";
import ClientInvoiceEdit from "./pages/windmill/client_invoice/ClientInvoiceEdit";

import EBStatementList from "./pages/eb_statement/EBStatementList";
import EBStatementAdd from "./pages/eb_statement/EBStatementAdd";
import EBStatementEdit from "./pages/eb_statement/EBStatementEdit";

import EBStatementSolarList from "./pages/eb_statement_solar/EBStatementSolarList";
import EBStatementSolarAdd from "./pages/eb_statement_solar/EBStatementSolarAdd";
import EBStatementSolarEdit from "./pages/eb_statement_solar/EBStatementSolarEdit";
import EBBillPdf from "./pages/windmill/eb_bill/EBBillPdf";
import EBStatementSolarPdf from "./pages/eb_statement_solar/EBStatementSolarPdf";

import BankReport from "./pages/report/Report";
import ForecastReport from "./pages/forecast_report/ForecastReport";
import BillingBankReport from "./pages/billing_report/BillingReport";
import Invoice from "./pages/invoice/invoice";
import EnergyReconcilation from "./pages/energy_reconcilation/EnergyReconcilation";
import ConsumptionRequest from "./pages/consumption_request/ConsumptionRequest";
import EnergyAllotment from "./pages/energy_allotment/EnergyAllotment";
import WindmillMasterList from "./pages/windmill_master/WindmillMasterList";
import WindmillMasterAdd from "./pages/windmill_master/WindmillMasterAdd";
import WindmillMasterEdit from "./pages/windmill_master/WindmillMasterEdit";

import TransmissionLossList from "./pages/transmission_loss_master/TransmissionLossList";
import TransmissionLossAdd from "./pages/transmission_loss_master/TransmissionLossAdd";
import TransmissionLossEdit from "./pages/transmission_loss_master/TransmissionLossEdit";
import CustomerList from "./pages/customer_master/CustomerList";
import CustomerAdd from "./pages/customer_master/CustomerAdd";
import CustomerEdit from "./pages/customer_master/CustomerEdit";

import ShareHoldingsList from "./pages/share_holdings/ShareHoldingsList";
import ShareHoldingsAdd from "./pages/share_holdings/ShareHoldingsAdd";
import ShareHoldingsEdit from "./pages/share_holdings/ShareHoldingsEdit";

import ConsumptionChargesList from "./pages/consumption_charges/ConsumptionChargesList";
import ConsumptionChargesAdd from "./pages/consumption_charges/ConsumptionChargesAdd";
import ConsumptionChargesEdit from "./pages/consumption_charges/ConsumptionChargesEdit";

import EdcMasterList from "./pages/edc_master/EdcMasterList";
import EdcMasterAdd from "./pages/edc_master/EdcMasterAdd";
import EdcMasterEdit from "./pages/edc_master/EdcMasterEdit";

import EmailMasterList from "./pages/email_master/EmailMasterList";
import EmailMasterAdd from "./pages/email_master/EmailMasterAdd";
import EmailMasterEdit from "./pages/email_master/EmailMasterEdit";

import CapacityList from "./pages/capacity_master/capacity_list";
import CapacityAdd from "./pages/capacity_master/capacity_add";
import CapacityEdit from "./pages/capacity_master/capacity_edit";

import InvestorsList from "./pages/investors_master/investors_list";
import InvestorsAdd from "./pages/investors_master/investors_add";
import InvestorsEdit from "./pages/investors_master/investors_edit";

import EBStatementPdf from "./pages/eb_statement/EBStatementPdf";



import Layout from "./components/Layout";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Component used for the root path – always send user to login first
// also clear any existing token so the login form is shown instead of
// immediately bouncing to dashboard

const RootRedirect = () => {
  // Check if token exists, redirect to windmill list if logged in, else to login
  const token = localStorage.getItem("access_token");
  if (token) {
    return <Navigate to="/windmill" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SessionManager>
          <Routes>
            {/* Root path always goes to login first */}
            <Route path="/" element={<RootRedirect />} />

            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
            {/* authenticated dashboard lives on /dashboard */}
            <Route path="/dashboard" element={<Index />} />
            {/* protected routes go here */}
            <Route path="/windmill/add" element={<WindmillAdd />} />
            <Route path="/windmill/edit/:id" element={<WindmillEdit />} />
            <Route path="/windmill" element={<WindmillList />} />

            <Route path="/windmill/eb-bill" element={<EBBillList />} />
            <Route path="/windmill/eb-bill/add" element={<EBBillAdd />} />
            <Route path="/windmill/eb-bill/edit/:id" element={<EBBillEdit />} />
            <Route path="/windmill/eb-bill/pdf" element={<EBBillPdf />} />


            <Route path="/windmill/actuals" element={<ActualsList />} />
            <Route path="/windmill/actuals/add" element={<ActualsAdd />} />
            <Route path="/windmill/actuals/edit/:id" element={<ActualsEdit />} />
            <Route path="/windmill/actuals/pdf" element={<ActualsPdf />} />


            <Route path="/windmill/client-invoice" element={<ClientInvoiceList />} />
            <Route path="/windmill/client-invoice/add" element={<ClientInvoiceAdd />} />
            <Route path="/windmill/client-invoice/edit/:id" element={<ClientInvoiceEdit />} />
            <Route path="/eb-statement" element={<EBStatementList />} />
            <Route path="/eb-statement/add" element={<EBStatementAdd />} />
            <Route path="/eb-statement/edit/:id" element={<EBStatementEdit />} />
            <Route path="/eb-statement-solar" element={<EBStatementSolarList />} />
            <Route path="/eb-statement-solar/add" element={<EBStatementSolarAdd />} />
            <Route path="/eb-statement-solar/edit/:id" element={<EBStatementSolarEdit />} />
            <Route path="/eb-statement-solar/pdf" element={<EBStatementSolarPdf />} />
            <Route path="/bank-report" element={<BankReport />} />
            <Route path="/consumption-bank-report" element={<Navigate to="/forecast-report" replace />} />
            <Route path="/forecast-report" element={<ForecastReport />} />
            <Route path="/billing-bank-report" element={<BillingBankReport />} />
            <Route path="/invoice" element={<Invoice />} />
            <Route path="/reconcilation" element={<EnergyReconcilation />} />
            <Route path="/consumption-request" element={<ConsumptionRequest />} />
            <Route path="/energy-allotment" element={<EnergyAllotment />} />
            <Route path="/master/windmill" element={<WindmillMasterList />} />
            <Route path="/master/windmill/add" element={<WindmillMasterAdd />} />
            <Route path="/master/windmill/edit/:id" element={<WindmillMasterEdit />} />
            <Route path="/master/windmill/view/:id" element={<WindmillMasterEdit />} />

            <Route path="/master/transmission-loss" element={<TransmissionLossList />} />
            <Route path="/master/transmission-loss/add" element={<TransmissionLossAdd />} />
            <Route path="/master/transmission-loss/edit/:id" element={<TransmissionLossEdit />} />
            <Route path="/master/customers" element={<CustomerList />} />
            <Route path="/master/customers/add" element={<CustomerAdd />} />
            <Route path="/master/customers/edit/:id" element={<CustomerEdit />} />
            <Route path="/master/share-holdings" element={<ShareHoldingsList />} />
            <Route path="/master/share-holdings/add" element={<ShareHoldingsAdd />} />
            <Route path="/master/share-holdings/edit/:id" element={<ShareHoldingsEdit />} />
            <Route path="/master/consumption-charges" element={<ConsumptionChargesList />} />
            <Route path="/master/consumption-charges/add" element={<ConsumptionChargesAdd />} />
            <Route path="/master/consumption-charges/edit/:id" element={<ConsumptionChargesEdit />} />

            <Route path="/master/edc-circle" element={<EdcMasterList />} />
            <Route path="/master/edc-circle/add" element={<EdcMasterAdd />} />
            <Route path="/master/edc-circle/edit/:id" element={<EdcMasterEdit />} />

            <Route path="/master/email" element={<EmailMasterList />} />
            <Route path="/master/email/add" element={<EmailMasterAdd />} />
            <Route path="/master/email/edit/:id" element={<EmailMasterEdit />} />

            <Route path="/master/capacity" element={<CapacityList />} />
            <Route path="/master/capacity/add" element={<CapacityAdd />} />
            <Route path="/master/capacity/edit/:id" element={<CapacityEdit />} />

            <Route path="/master/investors" element={<InvestorsList />} />
            <Route path="/master/investors/add" element={<InvestorsAdd />} />
            <Route path="/master/investors/edit/:id" element={<InvestorsEdit />} />
            <Route path="/eb-statement/pdf" element={<EBStatementPdf />} />

          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </SessionManager>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

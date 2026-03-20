import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDiff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ActualsPdf() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="mb-4 flex justify-between items-center no-print max-w-[210mm] mx-auto">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button className="flex items-center gap-2">
                    <FileDiff className="h-4 w-4" /> Comparison
                </Button>
            </div>

            <div className="bg-white mx-auto p-8 shadow-lg max-w-[210mm] min-h-[297mm] print:shadow-none print:p-0">
                <div className="text-center font-bold mb-6">
                    <h1 className="text-xl uppercase">Tamil Nadu Power Distribution Corporation Limited</h1>
                    <h2 className="text-lg uppercase">Office of the Superintending Engineer/ Coimbatore South</h2>
                </div>

                <div className="text-center font-bold mb-6">
                    <h3 className="text-md">Statement Showing the Energy Alloted for January, 2026</h3>
                </div>

                {/* General Info Grid */}
                <div className="border border-gray-300 mb-6 text-sm">
                    <div className="grid grid-cols-4 border-b border-gray-300">
                        <div className="p-2 bg-gray-50 font-semibold border-r border-gray-300">EDC Name</div>
                        <div className="p-2 border-r border-gray-300">COIMBATORE SOUTH</div>
                        <div className="p-2 bg-gray-50 font-semibold border-r border-gray-300">Statement Month</div>
                        <div className="p-2">January</div>
                    </div>
                    <div className="grid grid-cols-4 border-b border-gray-300">
                        <div className="p-2 bg-gray-50 font-semibold border-r border-gray-300">Service Number/isRec</div>
                        <div className="p-2 border-r border-gray-300">039224320165</div>
                        <div className="p-2 bg-gray-50 font-semibold border-r border-gray-300">Statement Year</div>
                        <div className="p-2">2026</div>
                    </div>
                    <div className="grid grid-cols-4 border-b border-gray-300">
                        <div className="p-2 bg-gray-50 font-semibold border-r border-gray-300">Company Name</div>
                        <div className="p-2 border-r border-gray-300">NEW VISION WIND POWER PLTD</div>
                        <div className="p-2 bg-gray-50 font-semibold border-r border-gray-300">Injection Voltage</div>
                        <div className="p-2">33KV</div>
                    </div>
                    <div className="grid grid-cols-4">
                        <div className="p-2 bg-gray-50 font-semibold border-r border-gray-300">Allow LowerAdjustment Slot</div>
                        <div className="p-2 border-r border-gray-300">Y</div>
                        <div className="p-2 bg-gray-50 font-semibold border-r border-gray-300">Allocation Completed Date</div>
                        <div className="p-2">04/02/2026</div>
                    </div>
                </div>

                {/* Allocated Summaries */}
                <div className="mb-6">
                    <h3 className="text-center font-bold mb-2">Allocated Summaries</h3>
                    <table className="w-full text-sm border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">Source</th>
                                <th className="border border-gray-300 p-2 text-left">C1</th>
                                <th className="border border-gray-300 p-2 text-left">C2</th>
                                <th className="border border-gray-300 p-2 text-left">C3</th>
                                <th className="border border-gray-300 p-2 text-left">C4</th>
                                <th className="border border-gray-300 p-2 text-left">C5</th>
                                <th className="border border-gray-300 p-2 text-left">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2 font-semibold">FROM POWERPLANT</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">318</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">1179</td>
                                <td className="border border-gray-300 p-2">449</td>
                                <td className="border border-gray-300 p-2">1946</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2 font-semibold">FROM BANKING</td>
                                <td className="border border-gray-300 p-2">1108</td>
                                <td className="border border-gray-300 p-2">33310</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">184575</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">218993</td>
                            </tr>
                            <tr className="bg-gray-50 font-bold">
                                <td className="border border-gray-300 p-2">TOTAL</td>
                                <td className="border border-gray-300 p-2">1108</td>
                                <td className="border border-gray-300 p-2">33628</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">185754</td>
                                <td className="border border-gray-300 p-2">449</td>
                                <td className="border border-gray-300 p-2">220939</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Balance */}
                <div className="mb-6">
                    <h3 className="text-center font-bold mb-2">Balance</h3>
                    <table className="w-full text-sm border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">Excess Units</th>
                                <th className="border border-gray-300 p-2 text-left">C1</th>
                                <th className="border border-gray-300 p-2 text-left">C2</th>
                                <th className="border border-gray-300 p-2 text-left">C3</th>
                                <th className="border border-gray-300 p-2 text-left">C4</th>
                                <th className="border border-gray-300 p-2 text-left">C5</th>
                                <th className="border border-gray-300 p-2 text-left">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2 font-semibold">BANKING</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">5793</td>
                                <td className="border border-gray-300 p-2">1828</td>
                                <td className="border border-gray-300 p-2">7621</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2 font-semibold">LAPSED</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Allocated Consumers */}
                <div className="mb-6">
                    <h3 className="text-center font-bold mb-2">Allocated Consumers</h3>
                    <table className="w-full text-xs border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">Consumer Name</th>
                                <th className="border border-gray-300 p-2 text-left">Consumer Service No</th>
                                <th className="border border-gray-300 p-2 text-left">Org Name</th>
                                <th className="border border-gray-300 p-2 text-left">Allocated</th>
                                <th className="border border-gray-300 p-2 text-left">C1</th>
                                <th className="border border-gray-300 p-2 text-left">C2</th>
                                <th className="border border-gray-300 p-2 text-left">C3</th>
                                <th className="border border-gray-300 p-2 text-left">C4</th>
                                <th className="border border-gray-300 p-2 text-left">C5</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2">TEXMO INDUSTRIES, UNIT-10</td>
                                <td className="border border-gray-300 p-2">039094300608</td>
                                <td className="border border-gray-300 p-2">COIMBATORE NORTH</td>
                                <td className="border border-gray-300 p-2 bg-blue-100">24648</td>
                                <td className="border border-gray-300 p-2 bg-blue-100">1108</td>
                                <td className="border border-gray-300 p-2 bg-blue-100">5882</td>
                                <td className="border border-gray-300 p-2 bg-blue-100">0</td>
                                <td className="border border-gray-300 p-2 bg-blue-100">17658</td>
                                <td className="border border-gray-300 p-2 bg-blue-100">0</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">M/s.Larsen and Toubro Limited, Precision Manufacturing&Systems(Unit-2)</td>
                                <td className="border border-gray-300 p-2">039094320526</td>
                                <td className="border border-gray-300 p-2">COIMBATORE SOUTH</td>
                                <td className="border border-gray-300 p-2">1946</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">318</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">1179</td>
                                <td className="border border-gray-300 p-2">449</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">M/s.Larsen and Toubro Limited PrecisionManufacturing&SystemsComplex (unit-1)</td>
                                <td className="border border-gray-300 p-2">039094320527</td>
                                <td className="border border-gray-300 p-2">COIMBATORE SOUTH</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">TEXMO INDUSTRIES UNIT 9A</td>
                                <td className="border border-gray-300 p-2">039094300002</td>
                                <td className="border border-gray-300 p-2">COIMBATORE NORTH</td>
                                <td className="border border-gray-300 p-2">142707</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">27428</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">115279</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">TEXMO INDUSTRIES (PUMP DIVISION)</td>
                                <td className="border border-gray-300 p-2">039094300030</td>
                                <td className="border border-gray-300 p-2">COIMBATORE NORTH</td>
                                <td className="border border-gray-300 p-2">51638</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">51638</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">TEXMO INDUSTRIES (MOTORDIVISION)</td>
                                <td className="border border-gray-300 p-2">039094300032</td>
                                <td className="border border-gray-300 p-2">COIMBATORE NORTH</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                            <tr className="bg-gray-50 font-bold">
                                <td className="border border-gray-300 p-2" colSpan={3}>Total</td>
                                <td className="border border-gray-300 p-2">220939.0</td>
                                <td className="border border-gray-300 p-2">1108.0</td>
                                <td className="border border-gray-300 p-2">33628.0</td>
                                <td className="border border-gray-300 p-2">0.0</td>
                                <td className="border border-gray-300 p-2">185754.0</td>
                                <td className="border border-gray-300 p-2">449.0</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Energy Allotment Order Charges */}
                <div className="mb-6">
                    <h3 className="text-center font-bold mb-2">Energy Allotment Order Charges</h3>
                    <table className="w-full text-xs border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">Consumer Name</th>
                                <th className="border border-gray-300 p-2 text-left">Consumer Service No</th>
                                <th className="border border-gray-300 p-2 text-left">M. R.C</th>
                                <th className="border border-gray-300 p-2 text-left">O.M. C</th>
                                <th className="border border-gray-300 p-2 text-left">T.R. C</th>
                                <th className="border border-gray-300 p-2 text-left">O. C</th>
                                <th className="border border-gray-300 p-2 text-left">K. P</th>
                                <th className="border border-gray-300 p-2 text-left">E. C</th>
                                <th className="border border-gray-300 p-2 text-left">S.H. C</th>
                                <th className="border border-gray-300 p-2 text-left">O. C</th>
                                <th className="border border-gray-300 p-2 text-left">D. C</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2">TEXMO INDUSTRIES, UNIT-10</td>
                                <td className="border border-gray-300 p-2">039094300608</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">M/s.Larsen and Toubro Limited, Precision Manufacturing&Systems(Unit-2)</td>
                                <td className="border border-gray-300 p-2">039094320526</td>
                                <td className="border border-gray-300 p-2">445</td>
                                <td className="border border-gray-300 p-2">16951</td>
                                <td className="border border-gray-300 p-2">53973</td>
                                <td className="border border-gray-300 p-2">895</td>
                                <td className="border border-gray-300 p-2">30</td>
                                <td className="border border-gray-300 p-2">483</td>
                                <td className="border border-gray-300 p-2">3240</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">59</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">M/s.Larsen and Toubro Limited PrecisionManufacturing&SystemsComplex (unit-1)</td>
                                <td className="border border-gray-300 p-2">039094320527</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">TEXMO INDUSTRIES UNIT 9A</td>
                                <td className="border border-gray-300 p-2">039094300002</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">TEXMO INDUSTRIES (PUMP DIVISION)</td>
                                <td className="border border-gray-300 p-2">039094300030</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">TEXMO INDUSTRIES (MOTORDIVISION)</td>
                                <td className="border border-gray-300 p-2">039094300032</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">0</td>
                            </tr>
                            <tr className="bg-gray-50 font-bold">
                                <td className="border border-gray-300 p-2" colSpan={2}>Total</td>
                                <td className="border border-gray-300 p-2">445</td>
                                <td className="border border-gray-300 p-2">16951</td>
                                <td className="border border-gray-300 p-2">53973</td>
                                <td className="border border-gray-300 p-2">895</td>
                                <td className="border border-gray-300 p-2">30</td>
                                <td className="border border-gray-300 p-2">483</td>
                                <td className="border border-gray-300 p-2">3240</td>
                                <td className="border border-gray-300 p-2">0</td>
                                <td className="border border-gray-300 p-2">59</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 text-sm">
                    <p>To,</p>
                    <p>- M/S. NEW VISION WIND POWER PLTD</p>
                </div>
            </div>

            <div className="mt-6 flex justify-end max-w-[210mm] mx-auto no-print">
                <Button className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]">
                    Save
                </Button>
            </div>
        </div>
    );
}

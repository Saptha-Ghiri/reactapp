import { useState } from "react"

export const QrCode = () => {
    const [img,setImg] = useState("");
    function generateQr() {
        setImg("")
    }
    function downloadQr(){}
  return (
    <>
    <div className='flex justify-center items-center h-full '>
    <div className='flex justify-center items-center  flex-col border border-black p-10 w-1/2 rounded-xl space-y-5'>
    <div>
        <img src="" alt="" />
    </div>
    <div className='flex space-x-3 items-center justify-center'>
        <label htmlFor="dataInput">Url: </label>
        <input className='px-4 py-1 outline-none border-2 rounded-lg border-gray-300 ' type="text" id='dataInput'/>
    </div>
    <div className='flex space-x-3 items-center justify-center'>
        <label htmlFor="">Size: </label>
        <input className='px-4 py-1 outline-none border-2 rounded-lg border-gray-300' type="text" id='sizeInput'/>
    </div>
    <div>
        <button onClick={()=> al()} className='text-white bg-green-700 hover:bg-white hover:text-green-700 transition duration-200 ease-in-out px-4 py-2 rounded-full'>Generate Qr Code</button>
        
    </div>
    <div>
        <button className='text-white bg-green-700 hover:bg-white hover:text-green-700 transition duration-200 ease-in-out px-4 py-2 rounded-full '>Download Qr Code</button>
    </div>
    </div>
    </div>
    </>
    )
}

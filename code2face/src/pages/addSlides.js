import React, {useState} from 'react'
import { Form , Button} from 'react-bootstrap'
import toast from 'react-hot-toast'
const serverLink = process.env.REACT_APP_BACKEND_URI
const AddSlides = () => {

    const [heading, setHeading] = useState("");
    const [body, setBody] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
        heading: heading,
        body: body
        };

        try {
            const response = await fetch(`${serverLink}/save_data`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
          
            if (response.ok) {
            //   console.log("Data saved successfully");
                toast.success("Slides Updated")
            } else {
              console.error("Error saving data:", response.status);
              toast.error('Error updating')
            }
          } catch (error) {
            console.error("Error saving data:", error);
            toast.error("Error sending data")
          }
          

        // Reset form fields
        setHeading("");
        setBody("");
    };



    return (
        <div className='cen-container mt-5 lcentral l-shadow'>
            <h3>Add New Slides</h3>
            <form onSubmit={handleSubmit} >
                {/* <label htmlFor="heading">Heading:</label> */}
                {/* <input
                    type="text"
                    id="heading"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    required
                /> */}
                
                {/* <label htmlFor="body">Body:</label>
                <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                ></textarea> */}
                <Form.Group className="mb-3" >
                    <Form.Label>Heading:</Form.Label>
                    <Form.Control type="text"
                    id="heading"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    required />
                </Form.Group>
                <Form.Group className="mb-3" >
                    <Form.Label>Body:</Form.Label>
                    <Form.Control as="textarea" 
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={3} />
                </Form.Group>

                <Button type="submit">Submit</Button>
            </form>
        </div>
    )
}

export default AddSlides
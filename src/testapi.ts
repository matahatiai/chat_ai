import express, { Request, Response, NextFunction, Express } from 'express';
const app: Express = express();

app.use(express.json());

const port = process.env.PORT || 8080;

app.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        res.status(200).json({
            message: 'Hurray!! we create our first server on bun js',
            success: true,
        });
    } catch (error: unknown) {
        next(new Error((error as Error).message));
    }
},
);

app.post('/conversation', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Access the body of the POST request
        const requestBody = req.body;
        // Process the request body
        console.log('Received POST request with body:', requestBody);
        // Respond to the client
        res.status(200).json({ message: 'POST request received', data: requestBody });
    } catch (error: unknown) {
        next(new Error((error as Error).message));
    }
});

app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
});
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


type props = {
    className?: string;
    onClose?: () => void;
}
export default function CardDemo({
    className = "", onClose }: props) {
    return (
        <Card className={`w-full max-w-sm ${className}`}>
            <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                    이메일을 입력하세요.
                </CardDescription>
                <CardAction>
                    <button onClick={onClose} className="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100">✕</button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <form>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="yourId@domain.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                {/* <a
                                    href="#"
                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                >
                                    Forgot your password?
                                </a> */}
                            </div>
                            <Input id="password" type="password" required />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full">
                    Login
                </Button>
                <Button variant="outline" className="w-full">
                    Sign Up
                </Button>
            </CardFooter>
        </Card>
    )
}
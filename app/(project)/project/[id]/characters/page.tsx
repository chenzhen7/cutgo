import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CharactersPage() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">角色生成</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        自动识别小说角色，生成外观和性格设定
                    </p>
                </div>
                <Button>生成角色</Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {["男主", "女主", "反派"].map((role) => (
                    <Card key={role}>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
                                    AI
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{role}</p>
                                    <p className="text-xs text-muted-foreground">年龄 / 性格 / 穿着风格</p>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground">
                                角色头像和详细设定将在这里展示
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

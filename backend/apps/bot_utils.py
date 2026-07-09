import os
import asyncio
from aiogram import Bot
from dotenv import load_dotenv

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")

async def send_stadium_notification_async(chat_id, text):
    """Aiogram orqali stadion egasiga asinxron xabar yuborish"""
    bot = Bot(token=BOT_TOKEN)
    try:
        await bot.send_message(chat_id=chat_id, text=text, parse_mode="Markdown")
    finally:
        await bot.session.close()

def send_bot_notification(chat_id, text):
    """Django (sinxron) muhitidan botga xabar yuborish uchun KO'PRIK"""
    if chat_id:
        try:
            asyncio.run(send_stadium_notification_async(chat_id, text))
        except Exception as e:
            print(f"Bot xabar yuborishda xatolik yuz berdi: {e}")
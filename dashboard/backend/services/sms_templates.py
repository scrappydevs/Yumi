"""
SMS message templates for reservation notifications
"""

def reservation_hold(restaurant_name: str, time_str: str, confirm_url: str) -> str:
    """Generate reservation invitation message"""
    return (
        f"🍽️ You're invited to {restaurant_name} on {time_str}!\n\n"
        f"Reply YES to confirm or NO to decline.\n\n"
        f"Confirm online: {confirm_url}\n\n"
        f"Reply STOP to opt out."
    )


def organizer_cancel_prompt(friend_name_or_phone: str, cancel_url: str) -> str:
    """Generate organizer cancellation prompt"""
    return (
        f"⚠️ {friend_name_or_phone} can't make it to your reservation.\n\n"
        f"Cancel the table? {cancel_url}\n\n"
        f"Or reply CANCEL to cancel now.\n\n"
        f"Reply STOP to opt out."
    )


def confirmed_reply() -> str:
    """Reply when user confirms"""
    return "✅ Confirmed! See you then!\n\nReply STOP to opt out."


def canceled_reply() -> str:
    """Reply when reservation is canceled"""
    return "✅ Reservation canceled. Thanks for letting us know!\n\nReply STOP to opt out."


def declined_reply() -> str:
    """Reply when user declines"""
    return "Thanks for the heads-up. We'll let the organizer know.\n\nReply STOP to opt out."


def help_reply() -> str:
    """Help message"""
    return "iFix Reservations: Reply YES to confirm, NO to decline.\n\nReply STOP to opt out."


def expired_reply() -> str:
    """Reply when reservation has expired"""
    return "This reservation has expired. Please contact the organizer.\n\nReply STOP to opt out."


def not_found_reply() -> str:
    """Reply when no pending reservation found"""
    return "We couldn't find a pending reservation for your number.\n\nReply HELP for assistance.\n\nReply STOP to opt out."


def opt_out_line() -> str:
    """Standard opt-out line"""
    return "Reply STOP to opt out."

